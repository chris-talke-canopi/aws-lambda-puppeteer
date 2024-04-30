const { SQSClient, SendMessageBatchCommand } = require("@aws-sdk/client-sqs");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");

// Create an SQS client
const sqsClient = new SQSClient({ region: "ap-southeast-2" });

exports.handler = async (event) => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        let payload = event.body;
        if (!payload && !payload.environment && !payload.courses && !payload.username && !payload.password) {
            return {
                status: 400,
                jsonBody: {
                    message: "Invalid payload",
                },
            };
        }

        const queueUrl = process.env.NEW_BATCH__QUEUE;
        const groupId = uuidv4();
        const now = new Date().toISOString();

        const Entries = [];
        const Jobs = [];
        for (let i = 0; i < payload.courses.length; i++) {
            const course = payload.courses[i];
            Entries.push({
                Id: uuidv4(),
                MessageBody: JSON.stringify({
                    courseId: course.id,
                    batchId: groupId,
                    name: course.name,
                }),
                MessageGroupId: groupId,
                MessageDeduplicationId: `${groupId}_${course.id}`,
            });
            Jobs.push({ courseId: course.id, batchId: groupId, status: 0, filename: null, location: null, created_at: now, updated_at: now });
        }

        const params = { QueueUrl: queueUrl, Entries };
        const command = new SendMessageBatchCommand(params);

        await supabase
            .from("be_jobs")
            .insert([{ batchId: groupId, status: 0, created_at: now, updated_at: now }])
            .select();

        await supabase.from("be_items").insert(Jobs).select();

        const data = await sqsClient.send(command);
        console.log("Batch send success:", data.Successful.map((msg) => msg.Id));
        
        return data;
    } catch (err) {
        console.error("Error in sending batch", err);
        throw err;
    }
};