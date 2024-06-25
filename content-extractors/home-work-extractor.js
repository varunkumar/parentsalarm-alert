import { BASE_URL, SCREENSHOT_PATH } from '../utils.js';
import { BaseExtractor } from './base-extractor.js';

const TITLE_SELECTOR = '.an-title';

class HomeWorkExtractor extends BaseExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/HomeWork`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.screenshot({ path: `${SCREENSHOT_PATH}/homework.png` });

    const posts = await this.page.$$eval(TITLE_SELECTOR, (elements) => {
      const isContentElement = (el) => {
        if (el?.hasAttribute('class')) {
          const cls = el?.getAttribute('class');
          return cls.indexOf('an-con') !== -1;
        }
        return false;
      };
      return elements.map((element) => {
        const date = element.innerText;
        let nextElement = element.nextElementSibling;
        let content = '';
        while (isContentElement(nextElement)) {
          content += '\n' + nextElement?.innerText; // eslint-disable-line
          nextElement = nextElement.nextElementSibling;
        }

        return {
          date: date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'),
          title: content,
        };
      });
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const post of posts) {
      post.date = new Date(post.date);
    }
    return posts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { HomeWorkExtractor };
