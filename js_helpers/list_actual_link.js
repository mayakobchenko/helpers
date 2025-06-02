import fs from 'fs'; 
import { Builder, By, until } from 'selenium-webdriver';

(async function scrapeOfficialLinks() {
    const journalsData = JSON.parse(fs.readFileSync('results.json', 'utf-8'));

    const driver = await new Builder().forBrowser('firefox').build(); // Use 'chrome' for Chrome browser
    const results = []; // Array to store results

    try {
        // Iterate over each journal object
        for (const journal of journalsData) {
            const { text, link } = journal; // Destructure text and link
            
            // Navigate to the journal link
            await driver.get(link);
            
            // Wait for the "Official Website" button to be located
            const officialWebsiteSelector = 'a.button[title="Official website"]' // Replace with the actual selector
            await driver.wait(until.elementLocated(By.css(officialWebsiteSelector)), 5000);
            
            // Find the "Official Website" link
            const officialLinkElement = await driver.findElement(By.css(officialWebsiteSelector));
            const officialLink = await officialLinkElement.getAttribute('href'); // Extract the official website link
            
            // Push the combined result into the results array
            results.push({ text, link, officialLink });
        }

        // Save results to a new JSON file
        fs.writeFileSync('websites.json', JSON.stringify(results, null, 2), 'utf-8');
        console.log('Results saved to output.json');

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // Close the browser
        await driver.quit();
    }
})();
