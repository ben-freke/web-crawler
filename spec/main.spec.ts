import { main } from '../src/main';

describe('main-entrypoint', () => {
    beforeEach(() => {});

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should log Hello World', async () => {
        console.log = jest.fn();
        main();
        expect(console.log).toHaveBeenCalledWith('Hello, World!');
    });
});