import { WebClient } from '@slack/web-api';

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const sendMessage = async (message, channel = '#parentsalarm') => {
  await web.chat.postMessage({
    channel,
    text: message,
  });
  console.log('Message posted!');
};

export default sendMessage;
