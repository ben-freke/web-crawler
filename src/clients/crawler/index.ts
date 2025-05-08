import axios from "axios";
import { Connection } from "./types";
import { Queue, Worker, Job } from 'bullmq';
import crypto from "crypto";
import {printError, printInfo, printTable} from "../../helpers/cli-printer";

const hashUrl = (url: string): string => crypto.createHash('sha256').update(url).digest('hex')

export class Crawler {

    private readonly targetDomain: string;
    private readonly startPage: string;
    private readonly regExp: RegExp;
    private readonly connection: Connection;
    private readonly crawlLimit: number;
    private queue: Queue;
    private urlSet: Set<string>;
    private worker: Worker;

    constructor(
        {targetDomain, startPage, regExOverride, crawlLimit, connection}:
        {targetDomain: string, startPage?: string, regExOverride?: RegExp, crawlLimit?: number, connection?: Connection}
    ) {
        this.targetDomain = targetDomain.toLowerCase();
        this.startPage = startPage?.toLowerCase() || `https://${this.targetDomain}`;
        this.crawlLimit = crawlLimit ?? -1;

        // Sourced from https://stackoverflow.com/questions/6038061/regular-expression-to-find-urls-within-a-string
        this.regExp = regExOverride ||
            new RegExp(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm)

        this.urlSet = new Set<string>();

        this.connection = connection || {host: 'localhost', port: 6379};
        this.queue = new Queue('crawler', {connection: this.connection});

        this.worker = new Worker('crawler', async (job: Job) => {
            console.log(`Processing job ${job.id}`);
            console.log(`Crawling ${job.data.url}`);
            await this.crawlPage(job.data.url);
        }, {connection: this.connection});

        this.worker.on('drained', async () => await this.cleanup());
    }

    public async getBodyFromUrl(url: string): Promise<string> {
        const response = await axios.get(url);
        return response.data;
    }

    public extractUrlsFromBody(body: string): string[] {
        // Use the RegEx to extract the URLs from the body.
        const urls = [...body.matchAll(this.regExp)]

        // Filter the URLs by the domain we want and convert them to a list of string
        return urls
            .filter((url) => url[0].toLowerCase().startsWith(`https://${this.targetDomain}`))
            .map((url) => url[0])
    }

    public printUrls(source: string, urls: string[]): void {
        printTable({
            headers: ['URLs'],
            widths: [60],
            rows: urls.map((url) => [url]),
        })
    }

    public async addUrlToQueue(url: string): Promise<void> {
        this.urlSet.add(url);
        await this.queue.add('Crawler', {url: url}, {
            jobId: hashUrl(url),
            removeOnComplete: false,
            removeOnFail: true,
        });
    }

    public async crawlPage(url: string): Promise<void> {
        // mark this URL as visited to respect crawl limit
        this.urlSet.add(url);
        const body = await this.getBodyFromUrl(url);
        const filteredUrls = this.extractUrlsFromBody(body);
        this.printUrls(url, filteredUrls);
        // If we've not reached the crawl limit, add the filtered URLs to the queue to continue crawling
        if (this.crawlLimit === -1 || this.urlSet.size < this.crawlLimit) {
            filteredUrls.forEach((url) => this.addUrlToQueue(url));
        }
    }

    public async startCrawl(): Promise<void> {
        try {
            await this.queue.pause();
            await this.queue.obliterate();
        } catch (e) {
            printError(`Error while obliterating the queue. This may be because there are active jobs.`);
            if (e instanceof Error) {
                printInfo(`${e.message}` || 'Unknown error');
            }
            throw (e);
        }

        await this.addUrlToQueue(this.startPage);
    }

    public async cleanup(): Promise<void> {
        // Wait 10 seconds before checking and shutting down
        // This is to allow the queue to drain and process all jobs

        await new Promise(res => setTimeout(res, 10000));

        // Double-check all jobs are processed
        const counts = await this.queue.getJobCounts();
        const inProgress = counts.active + counts.waiting + counts.delayed;

        if (inProgress === 0) {
            console.log(this.urlSet)
            console.log('All jobs processed. Closing...');
            await this.worker.close();
            await this.queue.close();
            process.exit(0);
            // This is a controlled shutdown and is necessary to stop the application explicitly.
            // Otherwise the worker will continue to listen indefinitely.
            // In a real-world application, we might want to handle this differently.
        }
    }

}