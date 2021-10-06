import Log4js from 'log4js';
import puppeteer from 'puppeteer';
import EContentExtractor from './content-extractors/e-content-extractor.js';
import HomeWorkExtractor from './content-extractors/home-work-extractor.js';
import NoticeBoardExtractor from './content-extractors/notice-board-extractor.js';
import SMSExtractor from './content-extractors/sms-extractor.js';
import { login, logout, sleep } from './utils.js';

Log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    slack: {
      type: '@log4js-node/slack',
      token: process.env.SLACK_OAUTH_TOKEN,
      channel_id: process.env.LOGS_CHANNEL,
      username: process.env.BOT_NAME,
      layout: { type: 'pattern', pattern: '[%p] %c - %m%n' },
    },
  },
  categories: { default: { appenders: ['out', 'slack'], level: 'debug' } },
});
const logger = Log4js.getLogger('index');

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await login(browser);

  const extractors = [
    await new EContentExtractor(browser),
    await new HomeWorkExtractor(browser),
    await new NoticeBoardExtractor(browser),
    await new SMSExtractor(browser),
  ];
  logger.info(`Extractors initialized by ${process.env.EVENT_NAME}...`);
  logger.info('Force exiting to test retries');
  process.exit(1);
  const newItems = await Promise.all(
    extractors.map((extractor) => extractor.extractNew(true))
  );
  newItems.forEach((item) => {
    logger.info(item);
  });

  await sleep(1000);

  await logout(page);
  browser.close();
};

run();
