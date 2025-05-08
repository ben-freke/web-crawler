import {getArgs} from '../src/helpers/argument-parser';

describe('Argument Parser', () => {
    let originalArgv: string[];

    beforeEach(() => {
        originalArgv = process.argv;
    });

    afterEach(() => {
        process.argv = originalArgv;
    });

    it('should parse domain only, with default startPage and limit', () => {
        process.argv = ['node', 'script', '--domain', 'Example.COM'];
        const args = getArgs();

        expect(args.domain).toBe('example.com');
        expect(args.startPage).toBe('https://example.com');
        expect(args.crawlLimit).toBe(-1);
    });

    it('should strip protocol and lowercase domain', () => {
        process.argv = ['node', 'script', '--domain', 'https://Example.COM'];
        const args = getArgs();

        expect(args.domain).toBe('example.com');
    });

    it('should parse custom limit', () => {
        process.argv = ['node', 'script', '--domain', 'example.com', '--limit', '5'];
        const args = getArgs();

        expect(args.crawlLimit).toBe(5);
    });

    it('should parse custom startPage and normalize URL', () => {
        process.argv = ['node', 'script', '--domain', 'example.com', '--start-page', 'EXAMPLE.com/Page'];
        const args = getArgs();

        expect(args.startPage).toBe('https://example.com/page');
    });

    it('should throw error for invalid domain', () => {
        process.argv = ['node', 'script', '--domain', 'invalid_domain'];
        expect(() => getArgs()).toThrow('Invalid domain format');
    });

    it('should throw error for invalid startPage', () => {
        process.argv = ['node', 'script', '--domain', 'example.com', '--start-page', 'not a url'];
        expect(() => getArgs()).toThrow('Invalid start page format');
    });
}); 