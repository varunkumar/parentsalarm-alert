import { BASE_URL, SCREENSHOT_PATH } from '../utils.js';
import { BaseExtractor } from './base-extractor.js';

const DATA_SELECTOR = '.an-con';

class SMSExtractor extends BaseExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/ReceivedSms`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.screenshot({ path: `${SCREENSHOT_PATH}/sms.png` });

    await this.page.screenshot({
      path: `${SCREENSHOT_PATH}/sms-submitted.png`,
    });

    let posts = await this.page.$$eval(DATA_SELECTOR, (elements) =>
      elements.map((e) => {
        let title = e.textContent;
        title = title.replace(/\s+/g, ' ').trim();
        title = title.replace(/\n/g, ' ').trim();

        // Sample date "\n                             Sent by : Greenfield Chennai International School on 25/06/2024 at 10:10 AM\n                        '"
        // Get the next sibling of the title element
        let date = e.nextElementSibling?.textContent?.trim() || '';
        date = date.split(' on ')[1]; // eslint-disable-line
        date = date.replace(' at ', ' ');
        date = new Date(
          date.replace(
            /(\d{2})\/(\d{2})\/(\d{4}) (\d+:\d+ [AP]M)/,
            '$2/$1/$3 $4'
          )
        ).toISOString();
        return { title, date };
      })
    );

    posts = posts.map((post) => ({
      title: post.title,
      date: new Date(post.date),
      content: '',
      attachments: [],
    }));
    return posts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { SMSExtractor };
