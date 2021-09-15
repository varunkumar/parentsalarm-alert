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
    const posts = await this.extractAll();
    console.debug(`${this.watermarkKey}: ${posts.length}`);

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
    console.debug(`${this.watermarkKey}: ${watermark}`);
    const filteredPosts = posts.filter((post) => {
      return new Date(post.date) > new Date(watermark);
    });

    // Update watermark
    if (filteredPosts.length > 0) {
      await updateWatermark(
        this.page,
        this.watermarkKey,
        filteredPosts[0].date
      );
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
