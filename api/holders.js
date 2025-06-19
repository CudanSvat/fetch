const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const contract = req.query.address;
  if (!contract) {
    res.status(400).json({ error: 'Missing contract address' });
    return;
  }

  const url = `https://voyager.online/contract/${contract}`;
  let browser;
  try {
    const isDev = !process.env.AWS_REGION;
    const executablePath = isDev
      ? undefined
      : await chromium.executablePath;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('div', { timeout: 15000 });

    const holders = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      for (let i = 0; i < divs.length; i++) {
        if (divs[i].textContent.trim() === 'Number of holders') {
          let next = divs[i].parentElement?.nextElementSibling;
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
      res.status(200).json({ holders });
    } else {
      res.status(404).json({ error: 'Holders count not found' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
};
