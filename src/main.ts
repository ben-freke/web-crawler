import { Crawler } from "./clients/crawler";

export const main = async (): Promise<void> => {

    const crawlerClient = new Crawler({
        targetDomain: 'www.bbc.co.uk',
        crawlLimit: 1000,
    })

    await crawlerClient.startCrawl();

}

(async () => {
    await main();
})();