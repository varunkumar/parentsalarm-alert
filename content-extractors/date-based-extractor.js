import { BaseExtractor } from './base-extractor.js';

const decodeWatermark = (watermarkStr) => {
  let watermark = '';
  try {
    watermark = JSON.parse(watermarkStr.replace(/'/g, '"').replace(/`/g, "'"));
    watermark.date = new Date(watermark.date);
  } catch (e) {
    // fallback to old watermark format of only date
    watermark = {
      date: new Date(watermarkStr),
      posts: {},
    };
  }
  return watermark;
};

const encodeWatermark = (watermark) =>
  JSON.stringify(watermark).replace(/'/g, '`').replace(/"/g, "'");

// This class is used for extractors where only the date part is available and
// the time is not. Watermark uses the datastructure:
// {date: 'DATEJSON', posts: {'postTitle1': 1, 'postTitle2': 1}}
class DateBasedExtractor extends BaseExtractor {
  // Filter posts after the watermark
  async filterPosts(posts, currentWatermark) {
    let filteredPosts = posts;
    const watermark = decodeWatermark(currentWatermark);
    if (Number.isNaN(watermark.date.getTime())) {
      this.logger.info(`Watermark is empty. First time extraction.`);
    } else {
      this.logger.info(`Filtering items after ${watermark.date.toJSON()}.`);
      filteredPosts = posts.filter(
        (post) =>
          new Date(post.date) > watermark.date ||
          (new Date(post.date).getTime() === watermark.date.getTime() &&
            !watermark.posts[post.title.replace(/'/g, '').replace(/"/g, '')])
      );
      this.logger.info(
        `Found ${
          filteredPosts.length
        } new items since ${watermark.date.toJSON()}.`
      );
    }
    return filteredPosts;
  }

  // Get watermark from posts
  static getWatermarkFromPosts(posts, currentWatermark) {
    const watermark = decodeWatermark(currentWatermark);
    if (posts && posts.length > 0) {
      let latestDate = watermark.date;
      posts.forEach((post) => {
        if (
          Number.isNaN(latestDate.getTime()) ||
          new Date(post.date) > latestDate
        ) {
          latestDate = new Date(post.date);
          watermark.date = latestDate;
          watermark.posts = {};
        }
        if (new Date(post.date).getTime() === latestDate.getTime()) {
          watermark.posts[post.title.replace(/'/g, '').replace(/"/g, '')] = 1;
        }
      });
    }
    return encodeWatermark(watermark);
  }
}

export { DateBasedExtractor, decodeWatermark, encodeWatermark };
