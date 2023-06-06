import { WebClient } from '@slack/web-api';
import Log4js from 'log4js';

const logger = Log4js.getLogger('slack');

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const sendMessage = async (message, channel = process.env.CHANNEL) => {
  await web.chat.postMessage({
    channel,
    text: message,
  });
  logger.info('Message posted!');
};

const readMessage = async (channel = process.env.CHANNEL) => {
  const response = await web.conversations.history({
    channel,
    limit: 1,
  });
  return response.messages[0].text;
};

export { readMessage, sendMessage };
