const instances = {};

// eslint-disable-next-line no-unused-vars
const updateWatermark = async (page, watermarkKey, watermark) => {};

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
    if (watermark) {
      console.log(
        `[${this.watermarkKey}] Filtering items after ${watermark}...`
      );
    } else {
      console.log(
        `[${this.watermarkKey}] Watermark is empty. First time extraction.`
      );
    }

    const filteredPosts = posts.filter(
      (post) => new Date(post.date) > new Date(watermark)
    );

    // Update watermark
    if (filteredPosts.length > 0) {
      const newWatermark = filteredPosts[0].date;
      await updateWatermark(this.page, this.watermarkKey, newWatermark);
      console.log(
        `[${this.watermarkKey}] Updating watermark to ${newWatermark}...`
      );
    }

    if (watermark) {
      console.log(
        `[${this.watermarkKey}] Found ${filteredPosts.length} new items since ${watermark}...`
      );
    }
    return filteredPosts;
  }

  // Extracts all posts.
  // eslint-disable-next-line no-empty-function, class-methods-use-this
  async extractAll() {}

  // Get current watermark.
  // eslint-disable-next-line no-empty-function, class-methods-use-this
  async getWatermark() {
    return null;
  }
}
