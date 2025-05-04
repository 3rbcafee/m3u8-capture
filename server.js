const express = require("express");
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const app = express();
const port = process.env.PORT || 3000;

// Route to get the m3u8 stream
app.get("/get-stream", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send({ error: "URL is required" });
  }

  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      executablePath: await chrome.executablePath,
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for the m3u8 link to appear
    const m3u8Link = await page.evaluate(() => {
      // Adjust this code to target the m3u8 URL from the network logs or page
      const m3u8Element = document.querySelector("video"); // Example: Change this selector
      return m3u8Element ? m3u8Element.src : null;
    });

    if (m3u8Link) {
      res.json({ m3u8Link });
    } else {
      res.status(404).send({ error: "m3u8 link not found" });
    }

    await browser.close();
  } catch (error) {
    console.error("Error fetching m3u8 link:", error);
    res.status(500).send({ error: "Failed to fetch m3u8 link" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
