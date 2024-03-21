const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {

  const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(process.env.AWS_EXECUTION_ENV ? "/opt/nodejs/node_modules/@sparticuz/chromium/bin" : undefined),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
  });
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