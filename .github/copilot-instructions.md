# ParentsAlarm Alert - AI Coding Assistant Instructions

## Project Overview

This is a **web scraping automation** that monitors a school's ParentsAlarm portal for updates and sends notifications via Slack. It uses Puppeteer for browser automation and runs on scheduled GitHub Actions for multiple student accounts.

## Architecture

### Multi-Account System

- Configured via `ACCOUNTS=AX,AY` environment variable (comma-separated account prefixes)
- Each account requires its own credentials: `{ACCOUNT}_USER_NAME`, `{ACCOUNT}_PASSWORD`, `{ACCOUNT}_PERSISTENT_VALUE_ACCESS_TOKEN`
- Each account has dedicated Slack channels: `{ACCOUNT}_CHANNEL` for general posts, `{ACCOUNT}_DM_CHANNEL` for SMS
- Runs sequentially through accounts (not parallel) due to browser login requirements

### Extractor Pattern (Inheritance-Based)

All content extractors inherit from [BaseExtractor](../content-extractors/base-extractor.js):

1. **BaseExtractor** - Foundation class with watermark management via persistent.aaim.io API

   - `extractNew()` - Main workflow: extract → filter → publish → update watermark
   - `extractAll()` - Must be implemented by subclasses to scrape specific content
   - `getWatermark()` / `updateWatermark()` - Persistent storage for tracking seen posts
   - `publishPosts()` - Sends formatted messages to Slack with account-specific channels

2. **DateBasedExtractor** extends BaseExtractor - For content with only date (no time)

   - Watermark structure: `{date: 'DATEJSON', posts: {'postTitle1': 1, 'postTitle2': 1}}`
   - Handles same-day posts by tracking titles in the `posts` object
   - Used by: EContentExtractor, NoticeBoardExtractor (partially)

3. **Concrete Extractors** (all in `content-extractors/`)
   - `EContentExtractor` - Educational content (videos, PDFs) from ViewEcontent page
   - `HomeWorkExtractor` - Homework assignments with subjects and attachments
   - `NoticeBoardExtractor` - School notices with **two-phase extraction**:
     1. List page → extract links
     2. Detail pages → navigate to each post for full content (see note below)
   - `SMSExtractor` - Direct messages (sent to DM channel instead of main channel)

**Critical Pattern**: NoticeBoardExtractor performs watermark filtering BEFORE navigating to detail pages to avoid unnecessary page loads. This is an optimization unique to this extractor.

### Persistent State Management

- Uses external service `persistent.aaim.io` for watermark storage (NOT local files)
- Each account has separate API tokens (`{ACCOUNT}_PERSISTENT_VALUE_ACCESS_TOKEN`)
- **Watermark formats**:
  - **BaseExtractor**: ISO date string - `"2025-12-15T10:30:00.000Z"`
  - **DateBasedExtractor**: Encoded JSON - `{date: '2025-12-15T00:00:00.000Z', posts: {'Math Homework': 1, 'Science Test': 1}}`
    - Encoding: `JSON.stringify()` then swap `"` → `'` and `'` → `` ` ``
    - Tracks same-day posts by title to avoid duplicate notifications
- Admin script (`admin.js`) can reset/update watermarks for debugging
  - Example: `extractor.updateWatermark(new Date('2025-12-01T00:00:00.000Z'))`
  - Use for testing or recovering from missed notifications

## Key Files and Responsibilities

- [index.js](../index.js) - Main entry point: initializes browser, loops accounts, runs all extractors
- [admin.js](../admin.js) - Manual watermark management (reset to specific date or clear)
- [slack.js](../slack.js) - Slack Web API integration with 4000-char message chunking logic
- [utils.js](../utils.js) - Login/logout automation, screenshot helpers, BASE_URL constant

## Developer Workflows

### Local Development

```bash
npm install
npm start  # Runs with TZ='Asia/Kolkata'
npm run reset  # Manually adjust watermarks via admin.js
npm run lint  # ESLint with airbnb-base + security plugin
```

### Environment Setup (.env file required)

```
ACCOUNTS=AX,AY
SLACK_OAUTH_TOKEN=xoxb-***
LOGS_CHANNEL=C*** (for application logs)
CHANNEL=#default (fallback channel)

AX_USER_NAME=student@example.com
AX_PASSWORD=***
AX_PERSISTENT_VALUE_ACCESS_TOKEN=***
AX_CHANNEL=C*** (main posts)
AX_DM_CHANNEL=D*** (SMS posts)
```

### GitHub Actions Integration

- **Scheduled runs**: Each account has separate workflow file (e.g., `adhiyan.yml`, `aganvee.yml`)
  - Cron schedules: Adhiyan runs at `:00, :10, :20...`, Aganvee at `:05, :15, :25...` (staggered by 5 min)
  - Also triggers on push/PR to main branch
- **Secrets → Environment conversion**: Uses `varunkumar/create-env-action@v1`
  - Converts GitHub Secrets to `.env` file at runtime
  - File location passed via `ENV_FILE_PATH` environment variable
  - utils.js handles fallback: local `.env` or `ENV_FILE_PATH`
- **Retry logic**: Wrapped with `nick-invision/retry@v2` (5 attempts, 15 min timeout)
- **Caching**: npm deps, node_modules, and Puppeteer Chromium binaries cached separately
- Badges in README show last run status per account

## Project Conventions

### Coding Standards

- **ES Modules** (`"type": "module"` in package.json) - Always use `.js` extensions in imports
- **ESLint**: airbnb-base + security plugin + prettier
- Disabled rules: `no-await-in-loop` (required for sequential scraping), `security/detect-object-injection` (false positives)
- **Sequential loops**: Use `for...of` with `await` for account processing (browser sessions can't run in parallel)

### Slack Message Formatting

- Dates formatted as `<!date^{unix_timestamp}^{date_short_pretty}|fallback>` for Slack's native date rendering
- Content wrapped in triple backticks with 4000-char limit per message
- Icons mapped per extractor type (see `ICON_MAP` in BaseExtractor)
- Attachment links formatted as `<url|name>`

### Screenshot Debugging

All extractors save screenshots to `./screenshot/` at key steps (login, form submission, content pages). Check these when debugging scraping issues.

### Common Pitfalls

1. **Timezone**: Application runs in `Asia/Kolkata` timezone (see `npm start` script)
2. **Watermark encoding**: DateBasedExtractor uses custom JSON encoding (single quotes replaced with backticks)
3. **Puppeteer navigation**: Always use `waitUntil: 'networkidle2'` or `'domcontentloaded'` - the portal's SPA behavior requires explicit waits
4. **Channel routing**: SMS posts MUST go to DM channels, not main channels (privacy requirement)

## Troubleshooting

### Login Failures

- **Symptoms**: Screenshots show login page after submission, no content extracted
- **Causes**: Incorrect credentials, portal changes to login selectors
- **Debug**: Check `screenshot/login-form-submitted.png` - should show dashboard, not login page
- **Fix**: Verify credentials in `.env`, inspect updated DOM selectors in utils.js

### Timeout Issues

- **Symptoms**: `Navigation timeout of 60000 ms exceeded`
- **Causes**: Slow portal response, network issues, SPA not settling
- **Fix**: Increase timeout in page.goto() calls or adjust `waitUntil` strategy
- **Note**: GitHub Actions has 15-minute timeout with 5 retries built-in

### Missing Posts

- **Symptoms**: Expected content not appearing in Slack
- **Debug checklist**:
  1. Check watermark value: `await extractor.getWatermark()` in admin.js
  2. Verify post dates are newer than watermark
  3. For DateBasedExtractor: check if post title is in watermark.posts object
  4. Review screenshots to confirm content exists on page
- **Fix**: Reset watermark to earlier date if content was missed

### Duplicate Notifications

- **Symptoms**: Same post sent to Slack multiple times
- **Causes**: Watermark not updating, extractor filterPosts() logic error
- **Debug**: Check persistent.aaim.io API responses in logs
- **Fix**: Ensure watermark API key is valid, check network connectivity

### Scraping Errors (DOM Changes)

- **Symptoms**: Empty arrays from `extractAll()`, missing fields in posts
- **Causes**: Portal UI updates changed CSS selectors
- **Debug**: Inspect screenshots, use browser DevTools on student.schoolcanvas.com
- **Fix**: Update selectors in extractor files (TITLE_SELECTOR, DATE_SELECTOR, etc.)

## Testing

**Note**: This project currently has **no automated test suite**. The `npm test` command only runs linter.

**Manual testing workflow**:

1. Set watermark to past date: `npm run reset` (edit admin.js first)
2. Run extraction: `npm start`
3. Verify Slack messages received
4. Check screenshots in `./screenshot/` directory
5. Inspect console logs for extractor output

**Testing considerations for contributors**:

- Test against real ParentsAlarm portal (no mocks/stubs)
- Requires valid credentials and active Slack workspace
- Use separate test Slack channels to avoid spamming production channels
- Consider adding unit tests for watermark encoding/decoding logic in DateBasedExtractor

## Adding New Extractors

1. Create new class extending `BaseExtractor` or `DateBasedExtractor` in `content-extractors/`
2. Implement `extractAll()` returning array of `{date, title, content, attachments}` objects
3. Register in [index.js](../index.js) extractors array
4. Add icon mapping to `ICON_MAP` in [BaseExtractor](../content-extractors/base-extractor.js)
5. Update `.env` template if new channels needed

## External Dependencies

- **Puppeteer** - Headless Chrome automation (student.schoolcanvas.com portal)
- **@slack/web-api** - Slack Bot API client
- **persistent.aaim.io** - Third-party watermark persistence (API key authenticated)
- **log4js** with @log4js-node/slack - Structured logging to console + Slack logs channel
