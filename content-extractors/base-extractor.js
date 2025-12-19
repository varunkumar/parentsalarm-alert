import Log4js from 'log4js';
import { sendMessage } from '../slack.js';
import {
  getWatermark as getWatermarkFromStorage,
  setWatermark as setWatermarkToStorage,
} from '../watermark-storage.js';

const instances = {};
const ICON_MAP = {
  EContent: ':page_with_curl:',
  HomeWork: ':house_with_garden:',
  NoticeBoard: ':loudspeaker:',
  SMS: ':mailbox:',
};

const formatPosts = (watermarkKey, posts) => {
  const section = watermarkKey.replace('Extractor', '');
  // eslint-disable-next-line security/detect-object-injection
  const icon = ICON_MAP[section];
  const header = `${icon} ${section}: `;
  if (!posts || posts.length === 0) {
    return `${header} There are no new posts.\n`;
  }
  const formattedPosts = posts.map((post) => {
    const attachmentText = post.attachments
      ? post.attachments
          .map((attachment) => `<${attachment.url}|${attachment.name}>`)
          .join(', ')
      : '';
    // Format the post content as Slack code block with a cap of 4000 characters
    let { content } = post;
    if (content.length > 4000) {
      content = `${content.substring(0, 3900)}...`;
    }
    let contentBlock = `\`\`\`${content}\`\`\`\n`;
    if (content.length === 0) {
      contentBlock = '';
    }

    return `[<!date^${Math.floor(post.date / 1000)}^{date_short_pretty}|${
      post.date
    }>] *${post.title}*${contentBlock} ${attachmentText}`;
  });
  let messageCount = '';
  if (formattedPosts.length > 1) {
    messageCount = `There are *${formattedPosts.length}* new posts.`;
  } else {
    messageCount = 'There is *1* new post.';
  }
  return `${header} ${messageCount}\n\n${formattedPosts.join('\n')}\n\n`;
};

class BaseExtractor {
  async init(browser, account) {
    const { name } = this.constructor;
    const instanceCacheKey = `${name}_${account}`;
    // eslint-disable-next-line security/detect-object-injection
    if (instances[instanceCacheKey] !== undefined) {
      // eslint-disable-next-line security/detect-object-injection
      return instances[instanceCacheKey];
    }
    this.account = account;
    this.page = await browser.newPage();
    this.watermarkKey = name;
    this.logger = Log4js.getLogger(name);
    Object.freeze(this);
    // eslint-disable-next-line security/detect-object-injection
    instances[instanceCacheKey] = this;
    return this;
  }

  // Extracts posts since the last watermark. It updates the watermark with the latest post.
  async extractNew(publish = false) {
    this.logger.info(`Extracting items...`);
    const posts = await this.extractAll();
    this.logger.info(`Extracted ${posts.length} items.`);

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    const filteredPosts = await this.filterPosts(posts, watermark);

    if (publish) {
      await this.publishPosts(filteredPosts);
    }

    // Update watermark
    if (filteredPosts.length > 0) {
      const newWatermark = this.getWatermarkFromPosts(filteredPosts, watermark);
      this.logger.info(`Updating watermark to ${newWatermark}...`);
      await this.updateWatermark(newWatermark);
    }

    return filteredPosts;
  }

  // Extracts all posts.
  // eslint-disable-next-line no-empty-function, class-methods-use-this
  async extractAll() {}

  // Get current watermark.
  async getWatermark() {
    return getWatermarkFromStorage(this.watermarkKey, this.account);
  }

  // Update watermark
  async updateWatermark(watermark) {
    await setWatermarkToStorage(this.watermarkKey, this.account, watermark);
  }

  // Reset watermark
  async resetWatermark() {
    await setWatermarkToStorage(
      this.watermarkKey,
      this.account,
      '2015-11-07T08:48:00.000Z'
    );
  }

  // Filter posts after the watermark
  async filterPosts(posts, watermark) {
    let filteredPosts = posts;
    if (watermark) {
      this.logger.info(`Filtering items after ${watermark}.`);
      filteredPosts = posts.filter(
        (post) => new Date(post.date) > new Date(watermark)
      );
      this.logger.info(
        `Found ${filteredPosts.length} new items since ${watermark}.`
      );
    } else {
      this.logger.info(`Watermark is empty. First time extraction.`);
    }
    return filteredPosts;
  }

  // Publish posts to slack
  async publishPosts(posts) {
    if (posts && posts.length > 0) {
      this.logger.info(`Publishing items...`);
      let channel = process.env[`${this.account}_CHANNEL`];
      if (this.watermarkKey === 'SMSExtractor') {
        channel = process.env[`${this.account}_DM_CHANNEL`];
      }

      // Cap posts to prevent flooding Slack (e.g., when watermark is missing)
      const MAX_POSTS = 10;
      const postsToPublish = posts.slice(0, MAX_POSTS);

      if (posts.length > MAX_POSTS) {
        this.logger.warn(
          `Found ${posts.length} new items, but limiting to ${MAX_POSTS} to prevent Slack flooding.`
        );
      }

      await sendMessage(
        formatPosts(this.watermarkKey, postsToPublish),
        channel
      );
      this.logger.info(`Published ${postsToPublish.length} items.`);
    } else {
      this.logger.info(`No new items to publish.`);
    }
  }

  // Get watermark from posts
  // eslint-disable-next-line class-methods-use-this
  getWatermarkFromPosts(posts, currentWatermark) {
    if (posts && posts.length > 0) {
      return posts[0].date.toJSON();
    }
    return currentWatermark;
  }

  static assignIconBasedOnUrl(index, url) {
    if (url.includes('.pdf')) {
      return `:pdf: PDF-${index}`;
    }
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
      return `:image: Image-${index}`;
    }
    if (url.includes('.mp4') || url.includes('.mov')) {
      return `:video: Video-${index}`;
    }
    if (url.includes('.doc') || url.includes('.docx')) {
      return `:word: Doc-${index}`;
    }
    return `:link1: Link-${index}`;
  }
}

export { BaseExtractor, formatPosts };
