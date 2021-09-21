import { BASE_URL } from '../utils.js';
import BaseExtractor from './base-extractor.js';

const DATE_SELECTOR = 'section.bn p span[style="float:right"]';
const TITLE_SELECTOR = 'section.bn b';

export default class NoticeBoardExtractor extends BaseExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/NoticeBoard`, {
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
      let date = dateStr
        .replace(/\s+/g, ' ')
        .trim()
        .replace('Posted On : ', '');

      date = new Date(date);

      const title = titles[index].replace(/\s+/g, ' ').trim();

      return {
        date,
        title,
      };
    });

    return posts;
  }
}
