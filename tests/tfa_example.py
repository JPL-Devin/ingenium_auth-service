import requests
import getpass

if __name__ == '__main__':
    username = input('Username [%s]: ' % getpass.getuser())
    if not username:
        username = getpass.getuser()
    passcode = getpass.getpass('RSA passcode:')
    headers = {
        'X-AUTH-METHOD': 'rsa'
    }
    res = requests.get('http://localhost/auth_server/api/v2/login', 
        auth=requests.auth.HTTPBasicAuth(username, passcode), 
        headers=headers, 
        verify=False)

    print(f'status_code: {res.status_code}')
    print(f'out: {res.text}')