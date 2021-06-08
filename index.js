import puppeteer from 'puppeteer';
import { PASSWORD, USER_NAME } from './creds.js';
import { sleep } from './utils.js';

const login = async (page) => {
  const USER_NAME_SELECTOR = '#LoginId';
  const PASSWORD_SELECTOR = '#LoginPassword';
  const SUBMIT_SELECTOR = '#btnSignIn';

  await page.click(USER_NAME_SELECTOR);
  await page.keyboard.type(USER_NAME);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(PASSWORD);

  await page.click(SUBMIT_SELECTOR);

  await page.waitForNavigation();
};

const logout = async (page) => {
  await page.goto('https://www.parentsalarm.com/About/LogOut');
};

const run = async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto('https://www.parentsalarm.com/', {
    waitUntil: 'domcontentloaded',
  });

  await login(page);

  await sleep(1000);

  await logout(page);
  browser.close();
};

run();
