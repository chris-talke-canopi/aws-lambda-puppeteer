const puppeteer = require('puppeteer');

exports.handler = async (event) => {

    const browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();

    await page.goto('https://pptr.dev/');

    const text = await page.evaluate( () => {
        let text = document.querySelector('#__docusaurus_skipToContent_fallback > div > div > main > div > div > div.col.docItemCol_VOVn > div > article > div.theme-doc-markdown.markdown > blockquote').textContent;
        return text || `This didn't work`;
    });

    const response = {
      statusCode: 200,
      body: {
        message: text
      },
    }

    return response
  }