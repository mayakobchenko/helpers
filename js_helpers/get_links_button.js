//works to get urls without blocking
import fs from 'fs';
import { Builder, By, until } from 'selenium-webdriver';

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

(async function scrapeOfficialLinks() {
    const journalsData = JSON.parse(fs.readFileSync('results.json', 'utf-8'))
    const results = [];
    try {
        for (const journal of journalsData) {
            const { text, link } = journal
            const driver = await new Builder().forBrowser('firefox').build()
            try {
                await driver.get(link)
                const officialWebsiteSelector = 'a.button[title="Official website"]';
                await driver.wait(until.elementLocated(By.css(officialWebsiteSelector)), 5000)
                const officialLinkElement = await driver.findElement(By.css(officialWebsiteSelector))
                const officialLink = await officialLinkElement.getAttribute('href')
                
                if (officialLink) {
                    results.push({ text, officialLink })
                    console.log(`Scraped Official link for ${text}: ${officialLink}`)
                } else {
                    console.warn(`No official link found for ${text}`);
                }
            } catch (innerError) {
                console.error(`Failed to process ${text} (${link}): ${innerError.message}`);
            } finally {await driver.quit()}
        }

        fs.writeFileSync('websites.json', JSON.stringify(results, null, 2), 'utf-8'); // Save results
        console.log('Results saved to websites.json');
        
    } catch (error) {
        console.error('Error occurred:', error);
    } 
    await wait(Math.random() * 5000 + 50000)
})();
