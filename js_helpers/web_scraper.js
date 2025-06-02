//npm init -y
//npm install selenium-webdriver


import { Builder, By, Key, until } from 'selenium-webdriver';

(async function scrapeData() {
    const driver = await new Builder().forBrowser('firefox').build(); // you can also use 'chrome'
    
    try {
        await driver.get('https://research.com/journals-rankings/neuroscience'); // Replace with the URL you want to scrape

        // Wait for the desired element to be located (modify the selector according to your needs)
        await driver.wait(until.elementLocated(By.css('.journal-item')), 10000);

        // Extract data
        const items = await driver.findElements(By.css('.info'));
        const results = [];

        for (let item of items) {
            const title = await item.findElement(By.css('.title-selector')).getText();
            const description = await item.findElement(By.css('.description-selector')).getText();
            
            results.push({ title, description }); // Collecting data
        }

        console.log(results);
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // Close the browser
        await driver.quit();
    }
})();
