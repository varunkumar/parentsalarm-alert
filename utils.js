import { PASSWORD, USER_NAME } from './creds.js';

export const BASE_URL = 'https://www.parentsalarm.com';

export const sleep = async (ms) => {
  await new Promise((r) => setTimeout(r, ms));
};

export const login = async (browser) => {
  const page = await browser.newPage();
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
  });

  const USER_NAME_SELECTOR = '#LoginId';
  const PASSWORD_SELECTOR = '#LoginPassword';
  const SUBMIT_SELECTOR = '#btnSignIn';

  await page.click(USER_NAME_SELECTOR);
  await page.keyboard.type(USER_NAME);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(PASSWORD);

  await page.click(SUBMIT_SELECTOR);

  await page.waitForNavigation();

  return page;
};

export const logout = async (page) => {
  await page.goto(`${BASE_URL}/About/LogOut`);
};
