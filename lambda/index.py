import re
import boto3
import base64
import subprocess
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


SECRET_ARN = "SECRET_ARN"  # arn:aws:secretsmanager:us-west-2:0000:secret:secret-name
SECRET_TEXT = "SECRET_TEXT"  # username:password
SECRET_NAME = "SECRET_NAME"  # secret-name


def get_creds_type(s):
    if s.startswith("arn:aws"):
        return SECRET_ARN
    elif ":" in s:
        return SECRET_TEXT
    else:
        return SECRET_NAME


def cmd(command):
    try:
        return subprocess.check_output(command, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        logger.error("Command execution failed. Error output: %s", e.output)
        raise e


def get_ecr_login_credentials(region_name=None):
    ecr_client = (
        boto3.client("ecr", region_name=region_name)
        if region_name
        else boto3.client("ecr")
    )
    response = ecr_client.get_authorization_token()
    authorization_data = response["authorizationData"]
    auth0 = authorization_data[0]
    decoded_token = base64.b64decode(auth0["authorizationToken"]).decode("utf-8")
    username, password = decoded_token.split(":")
    return username, password, auth0["proxyEndpoint"].lstrip("https://")


def get_secret_from_sm(secret_name):
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return response["SecretString"]


def get_ecr_region_name(uri: str):
    match = re.search(r"dkr\.ecr\.(.+?)\.", uri)
    return match.group(1) if match else None


def is_domain(string):
    pattern = r"^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
    return re.match(pattern, string) is not None


def get_image_domain(uri: str, default_domain="docker.io"):
    p0 = uri.split("/")[0]
    return p0 if is_domain(p0) else default_domain


def crane_auth_login(username, password, server):
    logger.info(
        cmd(
            [
                "/opt/crane/crane",
                "auth",
                "login",
                "-u",
                username,
                "-p",
                password,
                server,
            ]
        )
    )


def crane_cp(src, dest):
    logger.info(cmd(["/opt/crane/crane", "cp", src, dest]))


def get_image_credentials(image_uri, creds):
    if "dkr.ecr" in image_uri:
        region_name = get_ecr_region_name(image_uri)
        username, password, endpoint = get_ecr_login_credentials(region_name)
    elif creds:
        creds_type = get_creds_type(creds)
        endpoint = get_image_domain(image_uri)
        if SECRET_TEXT == creds_type:
            logger.info("Get secret from inline config")
            username, password = creds.split(":")
        else:
            logger.info("Get secret from aws secrets manager")
            username, password = get_secret_from_sm(creds).split(":")
    else:
        return None, None, None
    return username, password, endpoint


def on_event(event, _):
    request_type = event["RequestType"]
    props = event["ResourceProperties"]

    if request_type == "Delete":
        logger.info("Nothing to do.")
    elif request_type == "Create" or request_type == "Update":
        src_image = props["SrcImage"]
        src_creds = props.get("SrcCreds")
        dest_image = props["DestImage"]
        dest_creds = props.get("DestCreds")

        src_username, src_password, src_endpoint = get_image_credentials(
            src_image, src_creds
        )
        dest_username, dest_password, dest_endpoint = get_image_credentials(
            dest_image, dest_creds
        )

        if src_username and src_password and src_endpoint:
            crane_auth_login(src_username, src_password, src_endpoint)
        if dest_username and dest_password and dest_endpoint:
            crane_auth_login(dest_username, dest_password, dest_endpoint)

        crane_cp(src_image, dest_image)
