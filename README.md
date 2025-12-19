# parentsalarm-alert

Enables notifications from ParentsAlarm app. The project uses puppeteer to open the app, extract contents and send notifications. Slack has been integrated for now.

![Adhiyan](https://github.com/varunkumar/parentsalarm-alert/actions/workflows/adhiyan.yml/badge.svg?event=schedule)

![Aganvee](https://github.com/varunkumar/parentsalarm-alert/actions/workflows/aganvee.yml/badge.svg?event=schedule)

## Configuration

Create a file `.env` locally under the projct root. It should contain the following lines:

```
ACCOUNTS=AX,AY
SLACK_OAUTH_TOKEN=****
LOGS_CHANNEL=****
BOT_NAME=****
EVENT_NAME="dev_run"
CHANNEL="#default_channel"

AX_USER_NAME=******
AX_PASSWORD=****
AX_CHANNEL=****
AX_DM_CHANNEL=****

AY_USER_NAME=******
AY_PASSWORD=****
AY_CHANNEL=****
AY_DM_CHANNEL=****
```

## Slack app configuration

```bash
npm install
npm start
```
