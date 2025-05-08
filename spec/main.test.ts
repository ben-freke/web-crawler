describe('main', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../src/helpers/cli-printer', () => ({
      printTitle: jest.fn(),
      printInfo: jest.fn(),
      printSuccess: jest.fn(),
      printWarning: jest.fn(),
      printError: jest.fn(),
      printTable: jest.fn(),
    }));
    jest.mock('../src/helpers/argument-parser', () => ({
      getArgs: jest.fn(),
    }));
    jest.mock('../src/clients/crawler', () => ({
      Crawler: jest.fn().mockImplementation(() => ({
        startCrawl: jest.fn(),
      })),
    }));
  });

  it('should print title, info, instantiate crawler and start crawl', async () => {
    const mockArgs = { domain: 'test.com', startPage: 'https://test.com', crawlLimit: 3 };
    const { getArgs } = require('../src/helpers/argument-parser');
    getArgs.mockReturnValue(mockArgs);
    const { printTitle, printInfo } = require('../src/helpers/cli-printer');
    const { Crawler } = require('../src/clients/crawler');
    const { main: runMain } = require('../src/main');

    await runMain();

    expect(printTitle).toHaveBeenCalledWith('Web Crawler');
    expect(printInfo).toHaveBeenCalledWith(
      `Crawling ${mockArgs.domain}, starting from ${mockArgs.startPage} with the following limit: ${mockArgs.crawlLimit}.`
    );
    expect(Crawler).toHaveBeenCalledWith({
      targetDomain: mockArgs.domain,
      startPage: mockArgs.startPage,
      crawlLimit: mockArgs.crawlLimit,
    });
    const crawlerInstance = (Crawler as jest.Mock).mock.results[0].value;
    expect(crawlerInstance.startCrawl).toHaveBeenCalled();
  });

  it('should display "none" when crawlLimit is -1', async () => {
    const mockArgs = { domain: 'example.org', startPage: 'https://example.org', crawlLimit: -1 };
    const { getArgs } = require('../src/helpers/argument-parser');
    getArgs.mockReturnValue(mockArgs);
    const { printTitle, printInfo } = require('../src/helpers/cli-printer');
    const { Crawler } = require('../src/clients/crawler');
    const { main: runMain } = require('../src/main');

    await runMain();

    expect(printTitle).toHaveBeenCalledWith('Web Crawler');
    expect(printInfo).toHaveBeenCalledWith(
      `Crawling ${mockArgs.domain}, starting from ${mockArgs.startPage} with the following limit: none.`
    );
    expect(Crawler).toHaveBeenCalledWith({
      targetDomain: mockArgs.domain,
      startPage: mockArgs.startPage,
      crawlLimit: mockArgs.crawlLimit,
    });
    const crawlerInstance = (Crawler as jest.Mock).mock.results[0].value;
    expect(crawlerInstance.startCrawl).toHaveBeenCalled();
  });
}); 