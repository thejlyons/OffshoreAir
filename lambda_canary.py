import os
import smtplib
from datetime import datetime
from urllib.request import Request, urlopen
from email.mime.text import MIMEText

SITE = os.environ['SITE']
SMTP_DOMAIN = os.environ['SMPT_DOMAIN']
SMTP_PASSWORD = os.environ['SMTP_PASSWORD']
SMTP_SERVER = os.environ['SMTP_SERVER']
SMTP_USERNAME = os.environ['SMTP_USERNAME']
REPORT_EMAIL = os.environ['REPORT_EMAIL']


def send_error():
    server = smtplib.SMTP(SMTP_SERVER, 587)
    server.login(SMTP_USERNAME, SMTP_PASSWORD)

    msg = "Subject: \n\n"
    msg = MIMEText('Could not open estimate url.', 'html')

    msg['Subject'] = 'Offshore Air Ping Error'
    msg['From'] = 'Offshore Air Error <offshoreair-error@{}>'.format(SMTP_DOMAIN)
    msg['To'] = REPORT_EMAIL
    server.sendmail('Offshore Air Error <offshoreair-error@{}>'.format(SMTP_DOMAIN), REPORT_EMAIL, msg.as_string())


def lambda_handler(event, context):
    print('Checking {} at {}...'.format(SITE, event['time']))
    try:
        req = Request(SITE, headers={'User-Agent': 'AWS Lambda'})
        resp = urlopen(req)
    except:
        send_error()
        print('Check failed!')
    else:
        print('Check passed!')
    finally:
        print('Check complete at {}'.format(str(datetime.now())))


if __name__ == '__main__':
    lambda_handler({'time': str(datetime.now())}, None)
