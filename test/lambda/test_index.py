from index import (
    cmd,
    get_creds_type,
    get_ecr_region_name,
    get_image_domain,
    is_domain,
    SECRET_ARN,
    SECRET_TEXT,
    SECRET_NAME,
)


def test_secret_arn():
    s = "arn:aws:secretsmanager:us-west-2:0000:secret:secret-name"
    assert get_creds_type(s) == SECRET_ARN


def test_secret_text():
    s = "username:password"
    assert get_creds_type(s) == SECRET_TEXT


def test_secret_name():
    s = "secret-name"
    assert get_creds_type(s) == SECRET_NAME


def test_invalid_input():
    s = "invalid-input"
    assert get_creds_type(s) == SECRET_NAME


def test_cmd():
    assert "hello" == cmd(["echo", "-n", "hello"])


def test_get_ecr_region_name():
    uri = "00000000000.dkr.ecr.us-west-2.amazonaws.com/aws-cdk/assets"
    assert "us-west-2" == get_ecr_region_name(uri)

def test_is_domain():
    assert True == is_domain("public.ecr.aws")
    assert False == is_domain("fluent")


def test_get_image_domain():
    assert "docker.io" == get_image_domain("fluent/fluent-bit")
    assert "public.ecr.aws" == get_image_domain("public.ecr.aws/sam/build-python3.11")
