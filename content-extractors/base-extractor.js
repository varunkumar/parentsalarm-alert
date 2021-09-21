import fetch from 'node-fetch';

const instances = {};

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
      Object.freeze(this);
      // eslint-disable-next-line security/detect-object-injection
      instances[name] = this;
      return this;
    })();
  }

  // Extracts posts since the last watermark. It updates the watermark with the latest post.
  async extractNew() {
    console.log(`[${this.watermarkKey}] Extracting items...`);
    const posts = await this.extractAll();
    console.log(`[${this.watermarkKey}] Extracted ${posts.length} items.`);

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    let filteredPosts = posts;
    if (watermark) {
      console.log(
        `[${this.watermarkKey}] Filtering items after ${watermark}...`
      );
      filteredPosts = posts.filter(
        (post) => new Date(post.date) > new Date(watermark)
      );
      console.log(
        `[${this.watermarkKey}] Found ${filteredPosts.length} new items since ${watermark}...`
      );
    } else {
      console.log(
        `[${this.watermarkKey}] Watermark is empty. First time extraction.`
      );
    }

    // Update watermark
    if (filteredPosts.length > 0) {
      const newWatermark = filteredPosts[0].date;
      console.log(
        `[${
          this.watermarkKey
        }] Updating watermark to ${newWatermark.toJSON()}...`
      );
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
