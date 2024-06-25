/* eslint-disable no-await-in-loop */
import Log4js from 'log4js';
import puppeteer from 'puppeteer';
import { EContentExtractor } from './content-extractors/e-content-extractor.js';
import { HomeWorkExtractor } from './content-extractors/home-work-extractor.js';
import { NoticeBoardExtractor } from './content-extractors/notice-board-extractor.js';
import { SMSExtractor } from './content-extractors/sms-extractor.js';
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
  categories: { default: { appenders: ['out'], level: 'debug' } },
});
const logger = Log4js.getLogger('index');

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    // dumpio: true,
  });

  logger.info(`Extraction initialized by ${process.env.EVENT_NAME}.`);
  const accounts = process.env.ACCOUNTS.split(',');
  logger.info(`Accounts: ${accounts}`);
  // eslint-disable-next-line no-restricted-syntax
  for (const account of accounts) {
    logger.info(`Extracting contents for ${account}`);
    const page = await login(
      browser,
      process.env[`${account}_USER_NAME`],
      process.env[`${account}_PASSWORD`]
    );

    const extractors = [
      new EContentExtractor(),
      new HomeWorkExtractor(),
      new NoticeBoardExtractor(),
      new SMSExtractor(),
    ];
    await Promise.all(
      extractors.map((extractor) => extractor.init(browser, account))
    );
    const newItems = await Promise.all(
      extractors.map((extractor) => extractor.extractNew(true))
    );
    newItems.forEach((item) => {
      logger.info(item);
    });

    await sleep(1000);

    await logout(page);
  }
  browser.close();
};

run();
