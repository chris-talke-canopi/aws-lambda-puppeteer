const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const https = require("https");

const sqsClient = new SQSClient({ region: "ap-southeast-2" });
const s3Client = new S3Client({ region: "ap-southeast-2" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    const queueItem = event.Records[0];
    const payload = JSON.parse(queueItem.body);

    try {
        const { data: items } = await supabase.from('be_items').select('*').eq('courseId', payload.courseId).eq('batchId', payload.batchId);
        if (items.length === 0) throw new Error("No records found.");
        const item = items[0];

        // Use native Fetch API to download the file
        const fileResponse = await fetch(item.location, { method: "GET", agent: new https.Agent() });
        if (!fileResponse.ok) throw new Error("Failed to download file.");

        // Read the response data as a stream and accumulate it into a Buffer
        const chunks = [];
        for await (const chunk of fileResponse.body) {
            chunks.push(chunk);
        }
        const fileData = Buffer.concat(chunks);

        const s3Params = { Bucket: "canopi-bulkexporter", Key: `${item.batchId}/${item.filename}`, Body: fileData };
        const putObjectCommand = new PutObjectCommand(s3Params);
        await s3Client.send(putObjectCommand);

        console.log("File uploaded successfully:", s3Params.Key);

        // Update Item from '2 - Downloading', to '4 - Completed'
        const updatedItem = { status: 4, updated_at: new Date().toISOString() };
        await supabase.from("be_items").update(updatedItem).eq("courseId", payload.courseId).eq("batchId", payload.batchId).select();

        const queueUrl = process.env.NEW_BUNDLE__QUEUE;
        const params = { QueueUrl: queueUrl, MessageBody: queueItem.body, MessageGroupId: randomUUID(), MessageDeduplicationId: `${payload.courseId}_${payload.batchId}` };
        const command = new SendMessageCommand(params);
        await sqsClient.send(command);

        return;
    } catch (error) {
        console.error("Error processing event:", error);

        // Update Item from '2 - Downloading', to '3 - Failed'
        const updatedItem = { status: 3, updated_at: new Date().toISOString() };
        await supabase.from("be_items").update(updatedItem).eq("courseId", payload.courseId).eq("batchId", payload.batchId).select();

        return;
    }
};
