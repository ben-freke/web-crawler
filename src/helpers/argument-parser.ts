import yargs from "yargs";
import {hideBin} from "yargs/helpers";

export type Args = {
    domain: string;
    crawlLimit: number;
    startPage: string;
}

export const getArgs = (): Args => {
    const args = yargs(hideBin(process.argv))
        .epilogue('For more information, visit https://github.com/ben-freke/web-crawler')
        .option('domain', {
            type: 'string',
            description: 'The domain to crawl.',
            demandOption: true,
            coerce: (arg) => {
                const cleanArg = arg.replace(/^(https?:\/\/)/, '').toLowerCase();
                const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
                if (!domainRegex.test(cleanArg)) {
                    throw new Error('Invalid domain format');
                }
                return cleanArg;
            },
        })
        .option('limit', {
            type: 'number',
            description: 'The number of web pages to crawl until no more jobs should be added. Note that this is not a hard limit, as the crawler will continue to process any remaining jobs in the queue after reaching this limit.',
        })
        .option('start-page', {
            type: 'string',
            description: 'The starting page to crawl.',
            coerce: (arg) => {
                const urlRegex = /^(?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?::\d+)?(?:\/[^\s]*)?$/i;
                if (!urlRegex.test(arg)) {
                    throw new Error('Invalid start page format');
                }
                const url = arg.toLowerCase();
                return url.startsWith('http') ? url : `https://${url}`;
            },
        })
        .exitProcess(false)
        .fail((msg, err) => {
            if (err) throw err;
            throw new Error(msg);
        })
        .parseSync();

    return {
        domain: args.domain,
        crawlLimit: args.limit || -1,
        startPage: args.startPage || `https://${args.domain}`,
    }
}
