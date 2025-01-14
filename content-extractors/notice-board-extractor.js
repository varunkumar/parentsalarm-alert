/* eslint-disable no-await-in-loop */
import { BASE_URL, SCREENSHOT_PATH } from '../utils.js';
import { BaseExtractor } from './base-extractor.js';

const DATE_SELECTOR = 'section.bn span[style="float:right"]';
const TITLE_SELECTOR = 'section.bn b';
const LINK_SELECTOR = 'section.bn b a';
const ATTACHMENT_SELECTOR = 'section.bn a[title="Attachment"]';

class NoticeBoardExtractor extends BaseExtractor {
  async extractAll() {
    await this.page.goto(`${BASE_URL}/User/Student/NoticeBoard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.screenshot({ path: `${SCREENSHOT_PATH}/noticeboard.png` });

    const dates = await this.page.$$eval(DATE_SELECTOR, (elements) =>
      elements.map((e) => e.textContent)
    );

    const titles = await this.page.$$eval(TITLE_SELECTOR, (elements) =>
      elements.map((element) => element.textContent)
    );

    const urls = await this.page.$$eval(LINK_SELECTOR, (elements) =>
      elements.map((element) => element.href)
    );

    // Concat items from date and title at the same index
    const posts = dates.map((dateStr, index) => {
      let date = dateStr
        .replace(/\s+/g, ' ')
        .trim()
        .replace('Posted On : ', '')
        .replace(/(\d{2})\/(\d{2})\/(\d{4})(.*)/, '$2/$1/$3$4');

      date = new Date(date);

      const title = titles.at(index).replace(/\s+/g, ' ').trim();
      let url = urls.at(index);
      // construct absolute url relative to the current page
      url = new URL(url, this.page.url()).href;
      const attachments = [
        {
          url,
          name: 'Link',
        },
      ];

      return {
        date,
        title,
        content: '',
        attachments,
      };
    });

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    const filteredPosts = await this.filterPosts(posts, watermark);

    // Navigate to each post and extract contents & attachments
    // eslint-disable-next-line no-restricted-syntax
    for (const post of filteredPosts) {
      await this.page.goto(post.attachments[0].url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const content = await this.page.$eval('section.bn', (element) => {
        // Exclude the first h3 element ('Notice Details' message) and b element (title) from the content
        const children = Array.from(element.children);
        children.shift();
        children.shift();

        // Find and exclude the last span element ('Posted on: ...' message) from the content
        let lastChild = children[children.length - 1];
        while (lastChild && lastChild.tagName.toLowerCase() !== 'span') {
          children.pop();
          lastChild = children[children.length - 1];
        }
        if (lastChild) {
          children.pop();
        }

        const postText = children.map((child) => child.textContent).join('\n');
        return postText.trim();
      });

      post.content = content;

      const attachments = await this.page.$$eval(
        ATTACHMENT_SELECTOR,
        (elements) =>
          elements.map((element) => ({
            url: element.href,
            name: element.textContent.trim(),
          }))
      );

      post.attachments.push(...attachments);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const post of filteredPosts) {
      post.attachments = post.attachments.map((attachment, attachmentIndex) => {
        let { name } = attachment;
        const { url } = attachment;
        name =
          name || BaseExtractor.assignIconBasedOnUrl(attachmentIndex + 1, url);
        return { name, url };
      });
    }

    return filteredPosts;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { NoticeBoardExtractor };
