import { BASE_URL } from '../utils.js';
import DateBasedExtractor from './date-based-extractor.js';

const SUBMIT_SELECTOR = '.as-btn.cancel';
const DATE_SELECTOR = '.ec-tab-topic1';
const TITLE_SELECTOR = '.ec-tab-topic';

export default class EContentExtractor extends DateBasedExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/ViewEcontent`, {
      waitUntil: 'domcontentloaded',
    });

    await Promise.all([
      this.page.click(SUBMIT_SELECTOR),
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

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

      const title = titles.at(index).replace(/\s+/g, ' ').trim();

      return {
        date,
        title,
      };
    });

    return posts;
  }
}
