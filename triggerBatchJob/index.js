const AWS = require('aws-sdk');

AWS.config.update({ region: 'ap-southeast-2' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

exports.handler = async (event) => {
    const queueUrl = process.env.NEW_BATCH__QUEUE;

    const params = {
        MessageBody: JSON.stringify({
            data: "Example message data",
            timestamp: new Date().toISOString()
        }),
        QueueUrl: queueUrl
    };

    try {
        const data = await sqs.sendMessage(params).promise();
        console.log("Success, message sent. Message ID:", data.MessageId);
        return data;
    } 
    
    catch (err) {
        console.error("Error", err);
        throw err;
    }
};