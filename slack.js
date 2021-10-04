import { WebClient } from '@slack/web-api';
import Log4js from 'log4js';

const logger = Log4js.getLogger('slack');

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const sendMessage = async (message, channel = '#parentsalarm') => {
  await web.chat.postMessage({
    channel,
    text: message,
  });
  logger.info('Message posted!');
};

export default sendMessage;
