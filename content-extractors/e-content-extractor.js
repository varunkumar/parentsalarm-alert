import { BASE_URL, SCREENSHOT_PATH } from '../utils.js';
import { DateBasedExtractor } from './date-based-extractor.js';

const SUBMIT_SELECTOR = '.as-btn.cancel';
const DATE_SELECTOR = '.ec-tab-topic1';
const TITLE_SELECTOR = '.ec-tab-topic';

class EContentExtractor extends DateBasedExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/ViewEcontent`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.screenshot({ path: `${SCREENSHOT_PATH}/econtent.png` });

    await Promise.all([
      this.page.click(SUBMIT_SELECTOR),
      this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 60000,
      }),
    ]);

    await this.page.screenshot({
      path: `${SCREENSHOT_PATH}/econtent-submitted.png`,
    });

    const dates = await this.page.$$eval(DATE_SELECTOR, (elements) =>
      elements.map((e) => e.textContent)
    );

    const titles = await this.page.$$eval(TITLE_SELECTOR, (elements) =>
      elements.map((element) => element.textContent)
    );

    // Concat items from date and title at the same index
    const posts = dates.map((dateStr, index) => {
      let date = dateStr
        .replace(
          'Uploaded by Greenfield Chennai International School  |  Total Like - 25  |  Created on ',
          ' '
        )
        .trim();

      date = new Date(date);

      const title = titles
        .at(index)
        .replace(/\s+/g, ' ')
        .replace('`', '')
        .trim();

      return {
        date,
        title,
      };
    });

    return posts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { EContentExtractor };
