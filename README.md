# Web Crawler

A web crawler built with TypeScript that crawls websites while respecting domain boundaries and providing configurable crawl limits.

## Features

- 🔍 Domain-specific crawling
- ⚡ Asynchronous processing with BullMQ
- 🔄 Configurable crawl limits
- 🎯 Custom start page support

## Technologies Used

- **BullMQ**: For distributed job processing and queue management. Used mainly for extensibility 
- **Redis**: As the backend for BullMQ (required for queue management)
- **Axios**: For making HTTP requests
- **Yargs**: For command-line argument parsing
- **Jest**: For testing

## Prerequisites

- Node.js (v22 or higher)
- Redis server running locally (default: localhost:6379)

## Limitations

- The crawler does not handle JavaScript-rendered pages. It only fetches static HTML content.
- The crawler does not respect `robots.txt` rules. It will crawl all pages within the specified domain.
- The crawler does not handle rate limiting or politeness policies. It may send multiple requests to the same server in a short period.
- The crawler does not handle authentication or session management. It assumes that all pages are publicly accessible.
- The crawler does not handle redirects or canonical URLs. It will crawl all pages that match the specified domain, regardless of their status codes or canonical links.

There may be other limitations that I've not noticed :-)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ben-freke/web-crawler.git
cd web-crawler
```

2. Install dependencies:
```bash
npm install
```

3. Ensure Redis is running locally on the default port (6379). You can install redis using brew:
```bash
brew install redis
brew services start redis
```

## Usage

The crawler can be run with various options to customize its behavior:

```bash
npm run webcrawler -- --domain example.com [options]
```

### Command Line Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--domain` | The domain to crawl (e.g., example.com) | Yes | - |
| `--limit` | Maximum number of pages to crawl | No | -1 (no limit) |
| `--start-page` | Custom starting URL | No | https://{domain} |

### Examples

1. Basic crawl of a domain:
```bash
npm run webcrawler -- --domain example.com
```

2. Crawl with a page limit:
```bash
npm run webcrawler -- --domain example.com --limit 100
```

3. Crawl starting from a specific page:
```bash
npm run webcrawler -- --domain example.com --start-page https://example.com/sitemap.xml
```

4. Full crawl with all options:
```bash
npm run webcrawler -- --domain example.com --limit 1000 --start-page https://example.com/sitemap.xml
```

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Extensibility

Continuing this work, I would like to add the following features:

- **End to End Tests**: Implement end-to-end tests to ensure the crawler works as expected in various scenarios.
- **Allow Custom Number of Workers**: Allow users to specify the number of workers for concurrent processing.
- **JavaScript Rendering**: Use a headless browser (like Puppeteer) to handle JavaScript-rendered pages.
- **Robots.txt Compliance**: Implement a parser to respect the `robots.txt` rules of the target domain.
- **Rate Limiting**: Implement a mechanism to respect the crawl rate limits of the target domain.

## How It Works

1. The crawler starts by validating the input domain and start page
2. It initializes a BullMQ queue for managing crawl jobs
3. The first page is added to the queue
4. A worker processes each URL in the queue:
   - Fetches the page content
   - Extracts all URLs from the page
   - Filters URLs to match the target domain
   - Adds new URLs to the queue (respecting the crawl limit)
5. The process continues until:
   - The crawl limit is reached
   - No more URLs are found
   - The queue is empty

## Acknowledgments

- Regular expression for URL extraction sourced from [Stack Overflow](https://stackoverflow.com/questions/6038061/regular-expression-to-find-urls-within-a-string)