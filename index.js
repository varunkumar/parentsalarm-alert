import Log4js from 'log4js';
import puppeteer from 'puppeteer';
import EContentExtractor from './content-extractors/e-content-extractor.js';
import HomeWorkExtractor from './content-extractors/home-work-extractor.js';
import NoticeBoardExtractor from './content-extractors/notice-board-extractor.js';
import SMSExtractor from './content-extractors/sms-extractor.js';
import { login, logout, sleep } from './utils.js';

Log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: 'debug' } },
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
