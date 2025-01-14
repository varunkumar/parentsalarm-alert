/* eslint-disable security/detect-object-injection */
import { WebClient } from '@slack/web-api';
import Log4js from 'log4js';

const logger = Log4js.getLogger('slack');

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const sendMessage = async (message, channel = process.env.CHANNEL) => {
  // break the message into 4000 characters chunks without breaking the code blocks
  const chunks = message.match(/(```[^`]+```|[^`]+)/g);
  if (!chunks) {
    return;
  }
  let currentMessage = '';
  for (let i = 0; i < chunks.length; i += 1) {
    if (currentMessage.length + chunks[i].length > 4000) {
      if (currentMessage.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await web.chat.postMessage({
          channel,
          text: currentMessage,
        });
        currentMessage = '';
      }
    }
    currentMessage += chunks[i];
  }
  if (currentMessage.length > 0) {
    await web.chat.postMessage({
      channel,
      text: currentMessage,
    });
  }
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
