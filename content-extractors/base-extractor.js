import Log4js from 'log4js';
import fetch from 'node-fetch';
import sendMessage from '../slack.js';

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
  const formattedPosts = posts.map(
    (post) =>
      `        [<!date^${Math.floor(post.date / 1000)}^{date_short_pretty}|${
        post.date
      }>] *${post.title}*`
  );
  let messageCount = '';
  if (formattedPosts.length > 1) {
    messageCount = `There are *${formattedPosts.length}* new posts.`;
  } else {
    messageCount = 'There is *1* new post.';
  }
  return `${header} ${messageCount}\n\n${formattedPosts.join('\n')}\n\n`;
};

export default class BaseExtractor {
  constructor(browser) {
    const { name } = this.constructor;
    return (async () => {
      // eslint-disable-next-line security/detect-object-injection
      if (instances[name] !== undefined) {
        // eslint-disable-next-line security/detect-object-injection
        return instances[name];
      }
      this.page = await browser.newPage();
      this.watermarkKey = name;
      this.logger = Log4js.getLogger(name);
      Object.freeze(this);
      // eslint-disable-next-line security/detect-object-injection
      instances[name] = this;
      return this;
    })();
  }

  // Extracts posts since the last watermark. It updates the watermark with the latest post.
  async extractNew(publish = false) {
    this.logger.info(`Extracting items...`);
    const posts = await this.extractAll();
    this.logger.info(`Extracted ${posts.length} items.`);

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    let filteredPosts = posts;
    if (watermark) {
      this.logger.info(`Filtering items after ${watermark}...`);
      filteredPosts = posts.filter(
        (post) => new Date(post.date) > new Date(watermark)
      );
      this.logger.info(
        `Found ${filteredPosts.length} new items since ${watermark}...`
      );
    } else {
      this.logger.info(`Watermark is empty. First time extraction.`);
    }

    if (publish) {
      if (filteredPosts.length > 0) {
        this.logger.info(`Publishing items...`);
        await sendMessage(formatPosts(this.watermarkKey, filteredPosts));
        this.logger.info(`Published ${filteredPosts.length} items.`);
      } else {
        this.logger.info(`No new items to publish.`);
      }
    }

    // Update watermark
    if (filteredPosts.length > 0) {
      const newWatermark = filteredPosts[0].date;
      this.logger.info(`Updating watermark to ${newWatermark.toJSON()}...`);
      await this.updateWatermark(newWatermark);
    }

    return filteredPosts;
  }

  // Extracts all posts.
  // eslint-disable-next-line no-empty-function, class-methods-use-this
  async extractAll() {}

  // Get current watermark.
  async getWatermark() {
    const response = await fetch(
      `https://persistent.aaim.io/api/values/get?key=${this.watermarkKey}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': process.env.PERSISTENT_VALUE_ACCESS_TOKEN || '',
        },
      }
    );
    if (response.status !== 200) {
      throw new Error(`[${this.watermarkKey}] Failed to get watermark.`);
    }
    const watermark = await response.json();
    return watermark.data;
  }

  // Update watermark
  async updateWatermark(watermark) {
    const response = await fetch(
      `https://persistent.aaim.io/api/values/set?key=${this.watermarkKey}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.PERSISTENT_VALUE_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: `{"value":"${watermark.toJSON()}"}`,
      }
    );
    if (response.status !== 200) {
      throw new Error(`[${this.watermarkKey}] Failed to update watermark.`);
    }
  }

  // Reset watermark
  async resetWatermark() {
    const response = await fetch(
      `https://persistent.aaim.io/api/values/set?key=${this.watermarkKey}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.PERSISTENT_VALUE_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: `{"value":"2015-11-07T08:48:00.000Z"}`,
      }
    );
    if (response.status !== 200) {
      throw new Error(
        `[${this.watermarkKey}] Failed to reset watermark. ${response.statusText}`
      );
    }
  }
}
