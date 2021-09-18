const instances = {};

export class BaseExtractor {
  constructor(browser) {
    const name = this.constructor.name;
    return (async () => {
      if (instances[name] !== undefined) {
        return instances[name];
      }
      this.page = await browser.newPage();
      this.watermarkKey = name;
      Object.freeze(this);
      instances[name] = this;
      return this;
    })();
  }

  // Extracts posts since the last watermark. It updates the watermark with the latest post.
  async extractNew() {
    console.log(`[${this.watermarkKey}] Extracting items...`)
    const posts = await this.extractAll();
    console.log(`[${this.watermarkKey}] Extracted ${posts.length} items.`)

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    if (watermark) {
      console.log(`[${this.watermarkKey}] Filtering items after ${watermark}...`)
    } else {
      console.log(`[${this.watermarkKey}] Watermark is empty. First time extraction.`)
    }

    const filteredPosts = posts.filter((post) => {
      return new Date(post.date) > new Date(watermark);
    });

    // Update watermark
    if (filteredPosts.length > 0) {
      const newWatermark = filteredPosts[0].date;
      await updateWatermark(
        this.page,
        this.watermarkKey,
        newWatermark
      );
      console.log(`[${this.watermarkKey}] Updating watermark to ${newWatermark}...`)
    }

    if (watermark) {
      console.log(`[${this.watermarkKey}] Found ${filteredPosts.length} new items since ${watermark}...`)
    }
    return filteredPosts;
  }

  // Extracts all posts.
  async extractAll() {}

  // Get current watermark.
  async getWatermark() {
    return await this.page.evaluate(
      (watermarkKey) => localStorage.getItem(watermarkKey),
      this.watermarkKey
    );
  }
}

const updateWatermark = async (page, watermarkKey, watermark) => {
  await page.evaluate(
    (watermarkKey, watermark) => {
      localStorage.setItem(watermarkKey, watermark);
    },
    watermarkKey,
    watermark
  );
};
