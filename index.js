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

  let newItems = await Promise.all(
    extractors.map((extractor) => extractor.extractNew())
  );
  for (const items in newItems) {
    console.log(newItems[items].length);
  }

  await sleep(1000);

  await logout(page);
  browser.close();
};

run();
