import puppeteer from 'puppeteer';

const run = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.parentsalarm.com/');

  browser.close();
};

run();
