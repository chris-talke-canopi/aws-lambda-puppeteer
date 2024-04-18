const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            "https://canopi-chris-bucket.s3.ap-southeast-2.amazonaws.com/chromium-v112.0.2-pack.tar"
        ),
        headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://github.com/Sparticuz/chromium");
    const pageTitle = await page.title();
    await browser.close();

    return {
        status: 200,
        message: pageTitle,
    };
};
