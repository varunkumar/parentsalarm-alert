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
        const attachments = [];
        while (isContentElement(nextElement)) {
          if (nextElement?.querySelector('a')) {
            const anchor = nextElement.querySelector('a');
            attachments.push({
              name: anchor.innerText,
              url: anchor.href,
            });
          }
          const subject = nextElement?.innerText;
          content = `${content}\n${subject}\n`;
          nextElement = nextElement.nextElementSibling;
        }

        return {
          date: date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'),
          title: `Home Work - ${date}`,
          content: content.trim(),
          attachments,
        };
      });
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const post of posts) {
      post.date = new Date(post.date);
      // Name attachments based on the type of attachment
      const attachments = post.attachments.map(
        (attachment, attachmentIndex) => {
          let { name } = attachment;
          const { url } = attachment;
          name =
            name ||
            BaseExtractor.assignIconBasedOnUrl(attachmentIndex + 1, url);
          return { name, url };
        }
      );
      post.attachments = attachments;
    }
    return posts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { HomeWorkExtractor };
