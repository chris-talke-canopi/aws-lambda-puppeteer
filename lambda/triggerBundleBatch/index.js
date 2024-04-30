const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");
const Archiver = require('archiver');
const stream = require('stream');

const s3Client = new S3Client({ region: "ap-southeast-2" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function zipFilesInS3(bucket, prefix, destinationKey) {
    const archive = Archiver('zip', { zlib: { level: 9 } });
    const passThrough = new stream.PassThrough();

    archive.on('error', function(err) {
        throw new Error(`Archiving error: ${err}`);
    });

    // Start piping archive data to the passThrough stream
    archive.pipe(passThrough);

    const { Contents } = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    if (Contents.length === 0) {
        console.log("No files to archive.");
        return;
    }
    
    for (const content of Contents) {
        const objectData = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: content.Key }));
        archive.append(objectData.Body, { name: content.Key.split('/').pop() });
    }

    // Finalize the archive
    archive.finalize();

    const putObjectResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: destinationKey,
        Body: passThrough
    }));

    console.log("Files successfully zipped and uploaded:", putObjectResponse);
}

exports.handler = async (event) => {
    const { batchId } = JSON.parse(event.Records[0].body);

    try {
        const { data: items, error } = await supabase
            .from('be_items')
            .select()
            .eq('batchId', batchId);

        if (error) throw error;
        if (items.length === 0) throw new Error("No records found.");

        // Check if all items have status of at least 3 or 4
        if (items.every(item => item.status === 3 || item.status === 4)) {
            const bucketName = "canopi-bulkexporter";
            const folderPath = `${batchId}/`;
            const zipFilePath = `${folderPath}${batchId}.zip`;

            await zipFilesInS3(bucketName, folderPath, zipFilePath);
        } else {
            console.log("Not all items have the required status.");
        }
    } catch (error) {
        console.error("Error processing SQS event:", error);
        throw error;
    }
};
