const express = require("express");
const cors = require("cors"); // Import CORS
const puppeteer = require("puppeteer");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors()); // This will allow all websites to make requests to your API

app.get("/get-stream", async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is missing" });
  }

  try {
    // Decode the URL to ensure it's in the correct format
    const decodedUrl = decodeURIComponent(targetUrl);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

    // Use Puppeteer to extract the m3u8 link from the page
    const m3u8Link = await page.evaluate(() => {
      // Replace this with the correct logic to fetch the m3u8 link
      return document.querySelector("video").src; // Example selector
    });

    await browser.close();

    if (m3u8Link) {
      res.json({ m3u8: m3u8Link });
    } else {
      res.status(404).json({ error: "m3u8 link not found" });
    }
  } catch (error) {
    console.error("Error fetching m3u8 link:", error);
    res.status(500).json({ error: "Failed to fetch m3u8 link" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
