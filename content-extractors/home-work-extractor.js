import { BASE_URL } from '../utils.js';
import { DateBasedExtractor } from './date-based-extractor.js';

const DATE_SELECTOR = '.table-row:not([title])';
const TITLE_SELECTOR = '.table-row[title]';

class HomeWorkExtractor extends DateBasedExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/HomeWork`, {
      waitUntil: 'domcontentloaded',
    });

    const dates = await this.page.$$eval(DATE_SELECTOR, (elements) =>
      elements.map((e) => e.textContent)
    );

    const titles = await this.page.$$eval(TITLE_SELECTOR, (elements) =>
      elements.map((element) => element.textContent)
    );

    // Concat items from date and title at the same index
    const posts = dates.map((dateStr, index) => {
      let date = dateStr.trim().split('/').reverse().join('/');

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

// eslint-disable-next-line import/prefer-default-export
export { HomeWorkExtractor };
