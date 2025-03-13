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

async function download(url, dest, agent) {
  remove(dest);
  console.log(`download ${url}`);
  await pipeline(
    got.stream(url, { agent }),
    fs.createWriteStream(dest)
  );
}

function remove(dest) {
  console.log(`removing ${dest}`);
  fs.rmSync(dest, { force: true });
}


(async () => {
  const dir = process.argv[2];
  if (!dir) {
    throw new Error('Missing an argument');
  }
  mkdirp(dir);

  const bin = path.join(dir, 'bootstrap');
  const bootstrapExists = fs.existsSync(bin);
  const size = bootstrapExists ? fs.statSync(bin).size : 0;
  const oneMB = 1024*1024;

  // if the file doesn't exist or is obviously broken, download a new version
  if (!bootstrapExists || size < oneMB) {
    const agent = {};
    agent.https = process.env.HTTPS_PROXY ? new HttpsProxyAgent({proxy: process.env.HTTPS_PROXY}): undefined;
    agent.http = process.env.HTTP_PROXY ? new HttpProxyAgent({proxy: process.env.HTTP_PROXY}): undefined;

    try {
      await download(`${rootUrl}/releases/download/v${version}/bootstrap`, bin, agent);
      const expectedIntegrity = (await got(`${rootUrl}/releases/download/v${version}/bootstrap.sha256`, { agent })).body.trim();
      const integrity = await sha256sum(bin);

      if (integrity !== expectedIntegrity) {
        throw new Error(`Integrity check error: expected ${expectedIntegrity} but got ${integrity}`);
      }      
    } catch (err) {
      // we had a failure downloading or validating integrity of the bootstrap file, so let's remove it to be sure
      remove(bin);
      throw err;
    }
  }

})().catch(err => {
  console.error(err.toString());
  process.exit(1);
})
