import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
  // read from env file created by prev action
  dotenv.config({ path: process.env.ENV_FILE_PATH });
}

export const BASE_URL = 'https://www.parentsalarm.com';
export const SCREENSHOT_PATH = './screenshot';

export const sleep = async (ms) => {
  await new Promise((r) => {
    setTimeout(r, ms);
  });
};

export const login = async (
  browser,
  username = process.env.USER_NAME,
  password = process.env.PASSWORD
) => {
  const page = await browser.newPage();
  await page.goto(BASE_URL, {
    waitUntil: 'networkidle2',
    timeout: 0,
  });
  await page.screenshot({ path: `${SCREENSHOT_PATH}/home.png` });

  const USER_NAME_SELECTOR = '#LoginId';
  const PASSWORD_SELECTOR = '#LoginPassword';
  const SUBMIT_SELECTOR = '#btnSignIn';

  await page.click(USER_NAME_SELECTOR);
  await page.keyboard.type(username);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(password);

  await page.click(SUBMIT_SELECTOR);

  await page.screenshot({ path: `${SCREENSHOT_PATH}/login-form-filled.png` });
  await page.waitForNavigation({
    waitUntil: 'networkidle2',
    timeout: 0,
  });
  await page.screenshot({
    path: `${SCREENSHOT_PATH}/login-form-submitted.png`,
  });

  return page;
};

export const logout = async (page) => {
  await page.goto(`${BASE_URL}/About/LogOut`);
};
