const instances = {};

export class BaseExtractor {
  constructor(page) {
    const name = this.constructor.name;
    if (instances[name] !== undefined) {
      return instances[name];
    }
    this.page = page;
    this.watermarkKey = name;
    Object.freeze(this);
    instances[name] = this;
  }

  // Extracts posts since the last watermark. It updates the watermark with the latest post.
  async extractNew() {
    const posts = await this.extractAll();

    // Filter posts after the watermark
    const watermark = await this.getWatermark();
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

  // Reset watermark.
  async reset() {
    return await this.page.evaluate(
      (watermarkKey) => localStorage.removeItem(watermarkKey),
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
