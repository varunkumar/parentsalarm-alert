import { WebClient } from '@slack/web-api';

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const sendMessage = async (message, channel = '#parentsalarm') => {
  try {
    await web.chat.postMessage({
      channel,
      text: message,
    });
    console.log('Message posted!');
  } catch (error) {
    console.log(error);
  }
};

export default sendMessage;
