import { BASE_URL, SCREENSHOT_PATH } from '../utils.js';
import { DateBasedExtractor } from './date-based-extractor.js';

const SUBMIT_SELECTOR = '.as-btn.cancel';
const DATE_SELECTOR = '.ec-tab-topic1';
const TITLE_SELECTOR = '.ec-tab-topic';
const ATTACHMENT_SELECTOR = '.ec-tab-right';

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

    const attachments = await this.page.$$eval(
      ATTACHMENT_SELECTOR,
      (elements) =>
        elements.map((element) => {
          // Find all anchor keys without an inner img element with display none
          let anchors = Array.from(element.querySelectorAll('a'));
          anchors = anchors.filter((e) => {
            const img = e.querySelector('img');
            return !img || img.style.display !== 'none';
          });
          return anchors.map((anchor) => ({
            name: anchor.innerText,
            url: anchor.href,
          }));
        })
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

      // Name attachments based on the type of attachment
      const postAttachments = attachments
        .at(index)
        .map((attachment, attachmentIndex) => {
          let { name } = attachment;
          const { url } = attachment;
          name = name || this.assignIconBasedOnUrl(attachmentIndex + 1, url);
          return { name, url };
        });

      return {
        date,
        title,
        content: '',
        attachments: postAttachments,
      };
    });

    return posts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { EContentExtractor };
