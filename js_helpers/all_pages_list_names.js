import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36',
    // Add more user agents
];

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

(async function scrapeData() {
    const driver = await new Builder().forBrowser('firefox').build(); // Use 'chrome' for Chrome browser
    const results = [];

    try {
        // Scrape the first page
        let url = 'https://research.com/journals-rankings/neuroscience';
        await driver.get(url);
        
        const anchorSelector = 'a[title="Read more"]';
        await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000);
        
        // Scrape links from the first page
        const linkElementsFirstPage = await driver.findElements(By.css(anchorSelector));
        for (const linkElement of linkElementsFirstPage) {
            const text = await linkElement.getText();
            const relativeLink = await linkElement.getAttribute('href');
            const baseUrl = 'https://research.com';
            const fullLink = new URL(relativeLink, baseUrl).href;
            results.push({ text, link: fullLink });
        }

        // Scrape pages 2 to 5
        for (let page = 2; page <= 5; page++) {
            // Randomly select a user agent
            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await driver.executeScript(`Object.defineProperty(navigator, 'userAgent', { get: function() { return '${randomUserAgent}'; } });`);

            url = `https://research.com/journals-rankings/neuroscience?page=${page}`;
            await driver.get(url);
            
            await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000);
            
            // Scrape links from subsequent pages
            const linkElementsSubsequentPages = await driver.findElements(By.css(anchorSelector));
            for (const linkElement of linkElementsSubsequentPages) {
                const text = await linkElement.getText();
                const relativeLink = await linkElement.getAttribute('href');
                const baseUrl = 'https://research.com'; // Base URL for constructing full links
                const fullLink = new URL(relativeLink, baseUrl).href;
                results.push({ text, link: fullLink });
            }

            console.log(`Scraped page ${page}`);
            // Wait between page requests
            await wait(Math.random() * 3000 + 2000);  // Wait between 2 and 5 seconds
        }

        // Save results to a new JSON file
        fs.writeFileSync('results.json', JSON.stringify(results, null, 2), 'utf-8');
        console.log('Results saved to results.json');

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        await driver.quit();
    }
})();
