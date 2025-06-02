import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';

(async function scrapeData() {
    const driver = await new Builder().forBrowser('firefox').build(); // Use 'chrome' for Chrome browser
    const results = [];

    try {
        // Scrape the first page
        let url = 'https://research.com/journals-rankings/neuroscience'; // First page URL
        await driver.get(url);
        
        const anchorSelector = 'a[title="Read more"]';
        await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000);
        await scrapeLinks(driver, anchorSelector, results); // Scrape links from the first page

        // Scrape pages 2 to 5
        for (let page = 2; page <= 5; page++) {
            url = `https://research.com/journals-rankings/neuroscience?page=${page}`;
            await driver.get(url);
            
            await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000);
            await scrapeLinks(driver, anchorSelector, results); // Scrape links from subsequent pages

            console.log(`Scraped page ${page}`);
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

// Function to scrape links from a given page
async function scrapeLinks(driver, anchorSelector, results) {
    const linkElements = await driver.findElements(By.css(anchorSelector));

    // Iterate over the anchor elements to extract journal names and links
    for (const linkElement of linkElements) {
        const text = await linkElement.getText();
        const relativeLink = await linkElement.getAttribute('href');
        
        const baseUrl = 'https://research.com'; // Base URL for constructing full links
        const fullLink = new URL(relativeLink, baseUrl).href;
        results.push({ text, link: fullLink });
    }
}
