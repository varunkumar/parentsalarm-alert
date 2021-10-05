# parentsalarm-alert

Enables notifications from ParentsAlarm app. The project uses puppeteer to open the app, extract contents and send notifications. Slack has been integrated for now.

![ParentsAlarm CI](https://github.com/varunkumar/parentsalarm-alert/actions/workflows/node.js.yml/badge.svg?event=schedule)

## Configuration

Create a file `.env` locally under the projct root. It should contain the following lines:

```
USER_NAME=******
PASSWORD=****
PERSISTENT_VALUE_ACCESS_TOKEN=****
SLACK_OAUTH_TOKEN=****
CHANNEL=****
LOGS_CHANNEL=****
BOT_NAME=****
EVENT_NAME="dev_run"
```

## Slack app configuration

- Create a new slack app
- Add the scope `chat:write:bot`
- Generate OAUTH token
- Create channels as needed
- Update `SLACK_OAUTH_TOKEN`, `CHANNEL`, `LOGS_CHANNEL` and `BOT_NAME` in `.env`

## Persistent-aaim configuration

This project uses persistent-aaim to store the previous run status. Generate an access token by visiting the below link:

https://persistent.aaim.io/api/values/new_access_token?output=plain

Update `PERSISTENT_VALUE_ACCESS_TOKEN` in `.env`

## Build & run locally

```bash
npm install
npm start
```
