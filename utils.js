import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
  // read from env file created by prev action
  dotenv.config({ path: process.env.ENV_FILE_PATH });
}

export const BASE_URL = 'https://www.parentsalarm.com';

export const sleep = async (ms) => {
  await new Promise((r) => {
    setTimeout(r, ms);
  });
};

export const login = async (browser) => {
  const page = await browser.newPage();
  await page.goto(BASE_URL, {
    waitUntil: 'networkidle2',
    timeout: 0,
  });

  const USER_NAME_SELECTOR = '#LoginId';
  const PASSWORD_SELECTOR = '#LoginPassword';
  const SUBMIT_SELECTOR = '#btnSignIn';

  await page.click(USER_NAME_SELECTOR);
  await page.keyboard.type(process.env.USER_NAME);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(process.env.PASSWORD);

  await page.click(SUBMIT_SELECTOR);

  await page.waitForNavigation();

  return page;
};

export const logout = async (page) => {
  await page.goto(`${BASE_URL}/About/LogOut`);
};
