import { BASE_URL } from '../utils.js';

export const extract = async (page) => {
  await page.goto(`${BASE_URL}/User/Student/NoticeBoard`, {
    waitUntil: 'domcontentloaded',
  });

  const watermark = await getWatermark(page);

  const dates = await page.$$eval(
    'section.bn p span[style="float:right"]',
    (elements) => elements.map((e) => e.textContent)
  );

  const headers = await page.$$eval('section.bn b', (elements) =>
    elements.map((element) => element.textContent)
  );

  // Concat items from date and header at the same index
  const posts = dates.map((dateStr, index) => {
    let date = dateStr.replace(/\s+/g, ' ').trim().replace('Posted On : ', '');

    // convert date string to date object
    date = new Date(date);

    const header = headers[index].replace(/\s+/g, ' ').trim();

    return {
      date,
      header,
    };
  });

  await updateWatermark(page, posts[0].date);
};

export const getWatermark = async (page) => {
  return await page.evaluate(() => localStorage.getItem('watermark'));
};

const updateWatermark = async (page, watermark) => {
  // Persist the watermark to local storage
  await page.evaluate((watermark) => {
    localStorage.setItem('watermark', watermark);
  }, watermark);
};
