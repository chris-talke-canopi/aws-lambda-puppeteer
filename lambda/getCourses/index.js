const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const crypto = require('crypto');

exports.handler = async (event) => {

    let folders = {};
    let username = null;
    let password = null;
    
    // Get Payload & Decrypt Password
    const payload = JSON.parse(event.body);
    if (typeof payload.values === 'string') {
      payload.values = JSON.parse(payload.values);
    }
    
    const [ dec_username, dec_password ] = await fetch({
      method: 'get',
      url: 'https://i4nsjamm6qyrlm73fjtcqctwue0zrwge.lambda-url.ap-southeast-2.on.aws',
      headers: { 
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({
          action: process.env.DECRYPT_SECRET_ACTION,
          ...payload
      })
    })
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      console.log(error);
      return [null, null];
    });

    // If the Username & Password remain as 'null', then error out.
    if (!username && !password) {
        return {
            status: 400,
            message: "Invalid payload",
        };
    }

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            "https://canopi-chris-bucket.s3.ap-southeast-2.amazonaws.com/chromium-v123.0.1-pack.tar"
        ),
        headless: chromium.headless,
    });

    const page = await browser.newPage();
        
    await page.goto("https://id.articulate.com");
    
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
    
    console.log(`INFORMATION: Going to main page.`);
    await page.goto("https://rise.articulate.com/manage/all-content");
    await page.waitForSelector("#current-content");
    
    console.log(`INFORMATION: Getting folder structure.`)
    console.log(await page.title());
    await page.goto("https://rise.articulate.com/manage/api/folders/", { waitUntil: "networkidle0" });
    folders = await page.$eval('body', el => JSON.parse(el.innerText));
    
    const folders_arr = Object.keys(folders);
    console.log(`INFORMATION: '${folders_arr.length}' folders detected, proceeding with getting further data for each folder.`);
    for (var i = 0; i < folders_arr.length; i++) {
        const folder = folders_arr[i]
        console.log(`INFORMATION: Getting content for 'Folder Id: ${folder}'.`);
        folders[folder].items = await getContent(browser, `https://rise.articulate.com/manage/api/folders/${folder}?page=0&legacyViewEnabled=false&pageSize=50&sort=RECENT&type=ALL_CONTENT`);
    }

    return {
        status: 200,
        message: folders,
    };
};

async function getContent(browser, url) {
    let newPage = await browser.newPage();
    
    await newPage.goto(url, { waitUntil: "networkidle0" })
    let response = await newPage.$eval('body', el => JSON.parse(el.innerText));
    
    return response.content;
}

function decryptString(encryptedText, secret, iv) {
  const algorithm = 'aes-256-cbc';

  // Create a decipher with the secret key and IV
  const decipher = crypto.createDecipheriv(algorithm, secret, Buffer.from(iv, 'hex'));

  // Decrypt the encrypted text
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // Return the decrypted text
  return decrypted;
}