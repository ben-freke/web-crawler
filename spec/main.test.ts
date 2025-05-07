import { main } from '../src/main';
import { Crawler } from '../src/clients/crawler';

// Mock the Crawler class
jest.mock('../src/clients/crawler', () => ({
    Crawler: jest.fn().mockImplementation(() => ({
        startCrawl: jest.fn().mockResolvedValue(undefined)
    }))
}));

describe('main', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize crawler with correct parameters and start crawl', async () => {
        await main();

        expect(Crawler).toHaveBeenCalledWith({
            targetDomain: 'www.bbc.co.uk',
            crawlLimit: 1000
        });

        const crawlerInstance = (Crawler as jest.Mock).mock.results[0].value;

        expect(crawlerInstance.startCrawl).toHaveBeenCalled();
    });
}); 