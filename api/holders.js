const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const contract = req.query.address;
  if (!contract) {
    res.status(400).json({ error: 'Missing contract address' });
    return;
  }

  const url = `https://voyager.online/contract/${contract}`;
  let browser;
  
  try {
    // Try different browserless.io endpoint format with more options
    browser = await puppeteer.connect({
      browserWSEndpoint: 'wss://chrome.browserless.io?token=2SWv90LWZvR7pqPccc699392f9a652a5a60788e3c9b8d5132&stealth&blockAds=true'
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const holders = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      for (let div of divs) {
        if (div.textContent.trim() === 'Number of holders') {
          let next = div.parentElement?.nextElementSibling;
          if (next) {
            const num = next.textContent.replace(/[^0-9,]/g, '').replace(/,/g, '');
            if (num) return num;
          }
        }
      }
      return null;
    });

    if (holders) {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      res.status(200).json({ holders: parseInt(holders) });
    } else {
      res.status(404).json({ error: 'Holders count not found' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.disconnect();
  }
};
