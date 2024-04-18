const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {

    let username = event["queryStringParameters"]['username'];
    let password = event["queryStringParameters"]['password'];

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            "https://canopi-chris-bucket.s3.ap-southeast-2.amazonaws.com/chromium-v112.0.2-pack.tar"
        ),
        headless: chromium.headless,
    });

    const page = await browser.newPage();
        
    await page.goto("https://id.articulate.com/signin");
    
    console.log(`INFORMATION: Entering Username.`);
    await page.waitForSelector("input#email");
    await page.waitForSelector("button#signin-button");
    await page.type("input#email", username);
    await page.click("button#signin-button");
    
    console.log(`INFORMATION: Entering Password.`);
    await page.waitForSelector("input#password");
    await page.waitForSelector('button[data-ba="login.signInButton"]');
    await page.type("input#password", password);
    await page.click('button[data-ba="login.signInButton"]');
    
    console.log(`INFORMATION: Signing In.`);
    await page.waitForSelector('input#user_first_name');
    
    console.log(`INFORMATION: Getting folder structure.`)
    await page.goto("https://rise.articulate.com/manage/api/folders/", { waitUntil: "networkidle0" });
    folders = await page.$eval('body', el => JSON.parse(el.innerText));
    
    const folders_arr = Object.keys(folders);
    console.log(`INFORMATION: '${folders_arr.length}' folders detected, proceeding with getting further data for each folder.`);
    await Promise.all(folders_arr.map(async key => {
        const folder = folders[key];
        console.log(`INFORMATION: Getting content for 'Folder Id: ${folder.id}'.`);
        folders[key].items = await getContent(browser, `https://rise.articulate.com/manage/api/folders/${folder.id}?page=0&legacyViewEnabled=false&pageSize=50&sort=RECENT&type=ALL_CONTENT`);
    }));    
    
    browser.close();

    return {
        status: 200,
        message: folders,
    };
};
