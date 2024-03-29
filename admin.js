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
  const page = await login(browser);

  const extractors = [
    await new EContentExtractor(browser),
    await new HomeWorkExtractor(browser),
    await new NoticeBoardExtractor(browser),
    await new SMSExtractor(browser),
  ];

  await Promise.all(
    extractors.map((extractor) =>
      extractor.updateWatermark(new Date('2021-09-01T00:00:00.000Z'))
    )
  );

  await sleep(1000);

  await logout(page);
  browser.close();
};

run();
