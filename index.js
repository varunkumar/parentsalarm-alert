import puppeteer from 'puppeteer';
import { NoticeBoardExtractor } from './content-extractors/notice-board-extractor.js';
import { login, logout, sleep } from './utils.js';

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await login(browser);

  const extractors = [new NoticeBoardExtractor(page)];

  await Promise.all(extractors.map((extractor) => extractor.reset()));

  let newItems = await Promise.all(
    extractors.map((extractor) => extractor.extractNew())
  );
  // console.log(newItems);

  extractors.forEach(async (extractor) =>
    console.log(await extractor.getWatermark())
  );

  newItems = await Promise.all(
    extractors.map((extractor) => extractor.extractNew())
  );
  console.log(newItems);

  await sleep(1000);

  await logout(page);
  browser.close();
};

run();
