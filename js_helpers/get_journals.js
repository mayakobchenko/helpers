import { Builder, By, until } from 'selenium-webdriver';

(async function scrapeData() {
    const driver = await new Builder().forBrowser('firefox').build(); // Use 'chrome' for Chrome browser
    
    try {
        // Navigate to the desired webpage (replace with the actual URL)
        await driver.get('https://research.com/journals-rankings/neuroscience') // Replace with the actual URL
        
        // Wait until the required anchor element is located
        const anchorSelector = 'a[title="Read more"]'; // Use the title as the selector
        await driver.wait(until.elementLocated(By.css(anchorSelector)), 10000);
        
        // Find the anchor element
        const linkElement = await driver.findElement(By.css(anchorSelector));

        // Extract text
        const text = await linkElement.getText(); // "International Journal of Neuropsychopharmacology"

        // Extract URL (Relative)
        const relativeLink = await linkElement.getAttribute('href'); // "/journal/international-journal-of-neuropsychopharmacology"
        
        // Assuming the base URL is needed
        const baseUrl = 'https://research.com/journals-rankings/neuroscience'; // Replace with your base URL
        const fullLink = new URL(relativeLink, baseUrl).href; // Construct full URL

        console.log(`Text: ${text}`);
        console.log(`Full Link: ${fullLink}`);
        
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // Close the browser
        await driver.quit();
    }
})();
