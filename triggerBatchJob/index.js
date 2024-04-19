// Import the SQS client and required commands
const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs');
const { v4: uuidv4 } = require('uuid'); // Import UUID library for unique deduplication IDs

// Create an SQS client
const sqsClient = new SQSClient({ region: 'ap-southeast-2' });

exports.handler = async (event) => {

    console.log(event.body)

    let payload = {};
    if (event.body && isJsonString(event.body)) {
        payload = JSON.parse(event.body);
    }

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

    const params = {
        QueueUrl: queueUrl,
        Entries: payload.courses.map( (course, index) => ({
            Id: index + 1,
            MessageBody: {
                id: course.id,
                name: course.name
            },
            MessageGroupId: groupId,
            MessageDeduplicationId: uuidv4()
        }))
    };

    const command = new SendMessageBatchCommand(params);

    try {
        const data = await sqsClient.send(command);
        console.log("Batch send success:", data.Successful.map(msg => msg.Id));
        return data;
    } 
    
    catch (err) {
        console.error("Error in sending batch", err);
        throw err;
    }
};

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}