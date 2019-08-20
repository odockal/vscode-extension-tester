'use strict';

import { VSBrowser } from '../webdriver/browser';
import * as fs from 'fs-extra';
import Mocha = require('mocha');
import * as glob from 'glob';

/**
 * Mocha runner wrapper
 */
export class VSRunner {
    private mocha: Mocha;
    private chromeBin: string;
    private customSettings: Object;

    constructor(bin: string, customSettings: Object = {}) {
        this.mocha = new Mocha();
        this.chromeBin = bin;
        this.customSettings = customSettings;
    }

    /**
     * Set up mocha suite, add vscode instance handling, run tests
     * @param testFilesPattern glob pattern of test files to run
     */
    runTests(testFilesPattern: string): void {
        let self = this;
        let browser: VSBrowser = new VSBrowser(this.customSettings);
        const universalPattern = testFilesPattern.replace(/'/g, '');
        const testFiles = glob.sync(universalPattern);

        testFiles.forEach((file) => {
            if (fs.existsSync(file) && file.substr(-3) === '.js') {
                this.mocha.addFile(file);
            }
        });

        this.mocha.suite.beforeAll(async function () {
            this.timeout(15000);
            await browser.start(self.chromeBin);
            await browser.waitForWorkbench();
            await new Promise((res) => { setTimeout(res, 2000); });
        });

        this.mocha.suite.afterAll(async function() {
            this.timeout(15000);
            await browser.quit();
        });

        this.mocha.run((failures) => {
            process.exitCode = failures ? 1 : 0;
        });
    }
}