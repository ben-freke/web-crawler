import {Crawler} from '../src/clients/crawler';
import axios from 'axios';
import {Queue, Worker} from 'bullmq';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock existing the process
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process.exit called with code ${code}`);
});

// Mock bullmq
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue(undefined),
        obliterate: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn().mockResolvedValue(undefined),
        getJobCounts: jest.fn().mockResolvedValue({active: 0, waiting: 0, delayed: 0})
    })),
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined)
    }))
}));

describe('Crawler', () => {
    let crawler: Crawler;
    const mockTargetDomain = 'example.com';
    const mockStartPage = 'https://example.com';

    beforeEach(() => {
        jest.clearAllMocks();
        crawler = new Crawler({
            targetDomain: mockTargetDomain,
            startPage: mockStartPage,
            crawlLimit: 10
        });
    });

    afterEach(() => {
        mockExit.mockClear();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            const defaultCrawler = new Crawler({targetDomain: mockTargetDomain});
            expect(defaultCrawler['startPage']).toBe(`https://${mockTargetDomain}`);
            expect(defaultCrawler['crawlLimit']).toBe(-1);
        });

        it('should initialize with custom values', () => {
            expect(crawler['startPage']).toBe(mockStartPage);
            expect(crawler['crawlLimit']).toBe(10);
        });
    });

    describe('getBodyFromUrl', () => {
        it('should fetch and return page body', async () => {
            const mockBody = '<html><body>Test content</body></html>';
            mockedAxios.get.mockResolvedValueOnce({data: mockBody});

            const result = await crawler.getBodyFromUrl(mockStartPage);
            expect(result).toBe(mockBody);
            expect(mockedAxios.get).toHaveBeenCalledWith(mockStartPage);
        });

        it('should throw error when request fails', async () => {
            const error = new Error('Network error');
            mockedAxios.get.mockRejectedValueOnce(error);

            await expect(crawler.getBodyFromUrl(mockStartPage)).rejects.toThrow('Network error');
        });
    });

    describe('extractUrlsFromBody', () => {
        it('should extract URLs from body content', () => {
            const mockBody = `
                <a href="https://example.com/page1">Link 1</a>
                <a href="https://example.com/page2">Link 2</a>
                <a href="https://other-domain.com/page3">Link 3</a>
            `;

            const urls = crawler.extractUrlsFromBody(mockBody);
            expect(urls).toHaveLength(2);
            expect(urls).toContain('https://example.com/page1');
            expect(urls).toContain('https://example.com/page2');
            expect(urls).not.toContain('https://other-domain.com/page3');
        });

        it('should handle body with no URLs', () => {
            const mockBody = '<html><body>No links here</body></html>';
            const urls = crawler.extractUrlsFromBody(mockBody);
            expect(urls).toHaveLength(0);
        });
    });

    describe('addUrlToQueue', () => {
        it('should add URL to queue and urlSet', async () => {
            const mockUrl = 'https://example.com/test';
            await crawler.addUrlToQueue(mockUrl);

            const queue = crawler['queue'] as jest.Mocked<Queue>;
            expect(queue.add).toHaveBeenCalledWith(
                'Crawler',
                {url: mockUrl},
                expect.objectContaining({
                    jobId: expect.any(String),
                    removeOnComplete: false,
                    removeOnFail: true
                })
            );
        });
    });

    describe('crawlPage', () => {
        it('should crawl page and add new URLs to queue', async () => {
            const mockBody = `
                <a href="https://example.com/page1">Link 1</a>
                <a href="https://example.com/page2">Link 2</a>
            `;
            mockedAxios.get.mockResolvedValueOnce({data: mockBody});

            const addUrlToQueueSpy = jest.spyOn(crawler, 'addUrlToQueue');
            await crawler.crawlPage(mockStartPage);

            expect(mockedAxios.get).toHaveBeenCalledWith(mockStartPage);
            expect(addUrlToQueueSpy).toHaveBeenCalledTimes(2);
        });

        it('should respect crawl limit', async () => {
            const crawlerWithLimit = new Crawler({
                targetDomain: mockTargetDomain,
                crawlLimit: 1
            });

            const mockBody = `
                <a href="https://example.com/page1">Link 1</a>
                <a href="https://example.com/page2">Link 2</a>
            `;
            mockedAxios.get.mockResolvedValueOnce({data: mockBody});

            const addUrlToQueueSpy = jest.spyOn(crawlerWithLimit, 'addUrlToQueue');
            await crawlerWithLimit.crawlPage(mockStartPage);

            expect(addUrlToQueueSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('startCrawl', () => {
        it('should start crawl from start page', async () => {
            const addUrlToQueueSpy = jest.spyOn(crawler, 'addUrlToQueue');
            const queue = crawler['queue'] as jest.Mocked<Queue>;

            // Mock the queue to be paused before obliterate
            queue.pause.mockResolvedValueOnce(undefined);

            await crawler.startCrawl();

            expect(queue.pause).toHaveBeenCalled();
            expect(queue.obliterate).toHaveBeenCalled();
            expect(addUrlToQueueSpy).toHaveBeenCalledWith(mockStartPage);
        });
    });

    describe('cleanup', () => {
        it('should close worker and queue when no jobs are in progress', async () => {
            jest.useFakeTimers();

            const cleanupPromise = crawler.cleanup();
            jest.advanceTimersByTime(10000);

            const worker = crawler['worker'] as jest.Mocked<Worker>;
            const queue = crawler['queue'] as jest.Mocked<Queue>;

            await expect(cleanupPromise).rejects.toThrow('Process.exit called with code 0');
            expect(worker.close).toHaveBeenCalled();
            expect(queue.close).toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
}); 