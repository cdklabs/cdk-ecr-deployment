from index import get_creds_type, SECRET_ARN, SECRET_TEXT, SECRET_NAME

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
