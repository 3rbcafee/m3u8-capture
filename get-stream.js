import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(7000); // Give it time to load video streams

    const m3u8Url = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const stream = entries.find(e => e.name.includes('.m3u8'));
      return stream ? stream.name : null;
    });

    if (m3u8Url) {
      res.json({ stream: m3u8Url });
    } else {
      res.status(404).json({ error: 'm3u8 link not found' });
    }
  } catch (err) {
    console.error('Error fetching m3u8 link:', err);
    res.status(500).json({ error: 'Failed to fetch m3u8 link' });
  } finally {
    if (browser) await browser.close();
  }
}
