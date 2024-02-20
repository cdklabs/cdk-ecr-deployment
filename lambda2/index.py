import re
import boto3
import base64
import subprocess


def proc_run(command):
    try:
        return subprocess.check_output(command, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print(e.output)
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


def get_ecr_region_name(uri: str):
    match = re.search(r"dkr\.ecr\.(.+?)\.", uri)
    return match.group(1) if match else None


def crane_auth_login(username, password, server):
    return proc_run(
        ["/opt/crane/crane", "auth", "login", "-u", username, "-p", password, server]
    )


def crane_cp(src, dest):
    return proc_run(["/opt/crane/crane", "cp", src, dest])


def on_event(event, _):
    request_type = event["RequestType"]
    props = event["ResourceProperties"]

    if request_type == "Delete":
        print("We don't support delete remote image repo!")
    elif request_type == "Create" or request_type == "Update":
        src_image = props["SrcImage"]
        dest_image = props["DestImage"]

        if "dkr.ecr" in src_image:
            region_name = get_ecr_region_name(src_image)
            username, password, endpoint = get_ecr_login_credentials(region_name)
            print(crane_auth_login(username, password, endpoint))

        if "dkr.ecr" in dest_image:
            region_name = get_ecr_region_name(src_image)
            username, password, endpoint = get_ecr_login_credentials(region_name)
            print(crane_auth_login(username, password, endpoint))

        print(crane_cp(src_image, dest_image))


def lambda_handler(event, context):
    # Command to execute using Crane
    command = ["crane", "help"]

    try:
        # Execute the command and capture the output
        result = subprocess.check_output(command, text=True, stderr=subprocess.STDOUT)

        # Output the result to stdout
        print("Command output:")
        print(result)
        return {"statusCode": 200, "body": "Command executed successfully."}
    except subprocess.CalledProcessError as e:
        # Output error message to stdout
        print("Command execution failed. Error:")
        print(e.output)
        return {"statusCode": 500, "body": "Command execution failed."}
    except Exception as e:
        # Output exception to stdout
        print("Exception occurred:")
        print(str(e))
        return {"statusCode": 500, "body": "An error occurred."}
