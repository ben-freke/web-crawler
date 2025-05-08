import { Crawler } from "./clients/crawler";
import {printInfo, printTitle} from "./helpers/cli-printer";
import {getArgs} from "./helpers/argument-parser";
export const main = async (): Promise<void> => {

    printTitle('Web Crawler');

    const args = getArgs();
    printInfo(`Crawling ${args.domain}, starting from ${args.startPage} with the following limit: ${args.crawlLimit === -1 ? 'none' : args.crawlLimit}.`);

    const crawlerClient = new Crawler({
        targetDomain: args.domain,
        startPage: args.startPage,
        crawlLimit: args.crawlLimit
    })

    await crawlerClient.startCrawl();

}

(async () => {
    await main();
})();