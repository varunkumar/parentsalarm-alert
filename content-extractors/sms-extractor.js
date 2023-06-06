import { BASE_URL } from '../utils.js';
import { BaseExtractor } from './base-extractor.js';

const START_DATE_SELECTOR = '#valSentSmsDetails_StartDate';
const SUBMIT_SELECTOR = '#btnGetData';
const DATA_SELECTOR = '.fc-table tbody tr';

const PERIOD_RANGE = 30;

// Get start date in mm/dd/yyyy format
const getStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - PERIOD_RANGE);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};
class SMSExtractor extends BaseExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/ReceivedSms`, {
      waitUntil: 'domcontentloaded',
    });

    await Promise.all([
      this.page.$eval(
        START_DATE_SELECTOR,
        (e, startDate) => {
          e.setAttribute('value', startDate);
        },
        getStartDate()
      ),
      this.page.click(SUBMIT_SELECTOR),
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // take screenshot
    await this.page.screenshot({
      path: `sms-extractor.png`,
    });

    let posts = await this.page.$$eval(DATA_SELECTOR, (elements) =>
      elements.map((e) => {
        const title = e.querySelectorAll('td')[1].textContent;
        const date = e.querySelectorAll('td')[2].textContent;
        return { title, date };
      })
    );

    posts = posts.map((post) => ({
      title: post.title,
      date: new Date(post.date),
    }));
    return posts;
  }
}

export { SMSExtractor, getStartDate };
