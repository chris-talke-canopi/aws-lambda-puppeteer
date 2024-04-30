const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const sqsClient = new SQSClient({ region: "ap-southeast-2" });

exports.handler = async (event) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let username = process.env.RISE_USERNAME;
    let password = process.env.RISE_PASSWORD;

    const queueItem = event.Records[0];
    const payload = JSON.parse(queueItem.body);

    let download_package = null;

    // Update Job from '0 - Draft' to '1 - In Progress'
    await supabase.from("be_jobs").update({ status: 1, updated_at: (new Date()).toISOString() }).eq("batchId", payload.batchId).select();

    // Update Item from '0 - Draft', to '1 - In Progress'
    await supabase.from("be_items").update({ status: 1, updated_at: (new Date()).toISOString()}).eq("courseId", payload.courseId).eq("batchId", payload.batchId).select();

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath("https://canopi-chris-bucket.s3.ap-southeast-2.amazonaws.com/chromium-v123.0.1-pack.tar"),
            headless: chromium.headless
        });

        const page = await browser.newPage();
        await page.goto("https://id.articulate.com/signin");

        console.log(`INFORMATION: Entering Username`);
        await page.waitForSelector("input#email");
        await page.waitForSelector("button#signin-button");
        await page.type("input#email", username);
        await page.click("button#signin-button");

        console.log(`INFORMATION: Entering Password`);
        await page.waitForSelector("input#password");
        await page.waitForSelector('button[data-ba="login.signInButton"]');
        await page.type("input#password", password);
        await page.click('button[data-ba="login.signInButton"]');

        console.log(`INFORMATION: Signing In`);
        await page.waitForSelector("input#user_first_name");

        console.log(`INFORMATION: Opening Publish Page`);
        // await page.goto(`https://rise.articulate.com/author/${payload.courseId}#/author/course/export`, { waitUntil: "load", timeout: 0 });
        await page.goto(`https://rise.articulate.com/author/${payload.courseId}#/author/course/export`);
        await page.waitForSelector('select.dropdown__select');
        await page.select('select.dropdown__select', "3");
        await page.click("#app-header > div.app-header__btn-group > button");

        console.log(`INFORMATION: Entering Settings for Publishing`);
        await page.waitForResponse(async (networkResponse) => {
            if (networkResponse.url().includes("https://rise.articulate.com/api/rise-packages/api/packages/")) {
                console.log(`INFORMATION: Intercepted '/api/packages' network response`);
                const responseBody = await networkResponse.json();
                if (responseBody.finished) {
                    console.log(`INFORMATION: Download package finished`);
                    download_package = responseBody;
                    return true;
                }
            }
        });

        console.log(`INFORMATION: Filename is '${download_package.settings.filename}' and download link is '${download_package.location}'.`);

        // Update Item from '1 - In Progress', to '2 - Completed'
        const updatedItem = { status: 2, filename: download_package.settings.filename, location: download_package.location, updated_at: (new Date()).toISOString() };
        await supabase.from("be_items").update(updatedItem).eq("courseId", payload.courseId).eq("batchId", payload.batchId).select();

        const queueUrl = process.env.NEW_DOWNLOAD__QUEUE;
        const params = { QueueUrl: queueUrl, MessageBody: queueItem.body, MessageGroupId: randomUUID(), MessageDeduplicationId: `${payload.courseId}_${payload.batchId}` };
        const command = new SendMessageCommand(params);
        await sqsClient.send(command);

        return;
    } 
    
    catch (error) {
        console.log(error);

        // Update Item from '1 - In Progress', to '3 - Failed'
        await supabase.from("be_items").update({ status: 3, updated_at: (new Date()).toISOString() }).eq("courseId", payload.courseId).eq("batchId", payload.batchId).select();

        return null;
    }
};
