import subprocess


def proc_run(command):
    return subprocess.check_output(command, text=True, stderr=subprocess.STDOUT)


def on_event(event, _):
    request_type = event["RequestType"]
    props = event["ResourceProperties"]

    if request_type == "Delete":
        print("We don't support delete remote image repo!")
    elif request_type == "Create" or request_type == "Update":
        print(props)
        print(proc_run(["/opt/crane/crane", "help"]))


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
