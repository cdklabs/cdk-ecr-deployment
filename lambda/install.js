const fs = require('fs');
const got = require('got');
const path = require('path');
const stream = require('stream');
const crypto = require('crypto');
const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

const package = require('../package.json');
const version = package.version;
const rootUrl = package.repository.url.replace('git+', '').replace('.git', '');

function mkdirp(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function sha256sum(p) {
  return new Promise(function (resolve, reject) {
    const hash = crypto.createHash('sha256');

    fs.createReadStream(p)
      .on('error', reject)
      .on('data', chunk => hash.update(chunk))
      .on('close', () => resolve(hash.digest('hex')));
  });
}

async function download(url, dest) {
  const agent = {};
  agent.https = process.env.HTTPS_PROXY ? new HttpsProxyAgent({proxy: process.env.HTTPS_PROXY}): undefined;
  agent.http = process.env.HTTP_PROXY ? new HttpProxyAgent({proxy: process.env.HTTP_PROXY}): undefined;
  console.log(`download ${url}`);
  await pipeline(
    got.stream(url, { agent }),
    fs.createWriteStream(dest)
  );
}



(async () => {
  const dir = process.argv[2];
  if (!dir) {
    throw new Error('Missing an argument');
  }
  mkdirp(dir);

  const bin = path.join(dir, 'main');

  if (!fs.existsSync(bin)) {
    await download(`${rootUrl}/releases/download/v${version}/main`, bin);
    const expectedIntegrity = (await got(`${rootUrl}/releases/download/v${version}/main.sha256`)).body.trim();
    const integrity = await sha256sum(bin);

    if (integrity !== expectedIntegrity) {
      throw new Error(`Integrity check error: expected ${expectedIntegrity} but got ${integrity}`);
    }
  }

})().catch(err => {
  console.error(err.toString());
  process.exit(1);
})