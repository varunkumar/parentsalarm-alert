/* eslint-disable no-await-in-loop */
import puppeteer from 'puppeteer';
import { EContentExtractor } from './content-extractors/e-content-extractor.js';
import { HomeWorkExtractor } from './content-extractors/home-work-extractor.js';
import { NoticeBoardExtractor } from './content-extractors/notice-board-extractor.js';
import { SMSExtractor } from './content-extractors/sms-extractor.js';
import { login, logout, sleep } from './utils.js';

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const accounts = process.env.ACCOUNTS.split(',');
  // eslint-disable-next-line no-restricted-syntax
  for (const account of accounts) {
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
    // extractors = [extractors[2]];
    await Promise.all(
      extractors.map((extractor) => extractor.init(browser, account))
    );

    await Promise.all(
      extractors.map(
        (extractor) =>
          extractor.updateWatermark(new Date('2025-01-01T00:00:00.000Z'))
        // extractor.resetWatermark()
      )
    );

    const watermarks = await Promise.all(
      extractors.map((extractor) => extractor.getWatermark())
    );
    console.log(watermarks.join('\n'));
    await sleep(1000);

    await logout(page);
  }
  browser.close();
};

run();
