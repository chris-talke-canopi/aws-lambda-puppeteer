const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const archiver = require('archiver');
const { PassThrough } = require('stream');
const { createClient } = require("@supabase/supabase-js");

const s3 = new S3Client({ region: "ap-southeast-2" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      
exports.handler = async (event) => {

    const { batchId } = JSON.parse(event.Records[0].body);
    const { data: items, error } = await supabase.from('be_items').select().eq('batchId', batchId);

    const allCompletedOrFailed = items.every(item => item.status === 3 || item.status === 4);
    if (!allCompletedOrFailed) return;

    const sourceBucket = "canopi-bulkexporter";
    const outputBucket = "canopi-bulkexporter";
    const folderPath = `${batchId}`;
    const outputFileName = `${folderPath}/${batchId}.zip`;

    try {
        // List files in the source bucket
        const listObjects = await s3.send(new ListObjectsV2Command({
            Bucket: sourceBucket,
            Prefix: folderPath,
            Delimiter: "/"
        }));

        const files = listObjects.Contents;
        if (!files.length) {
            return 'No files to zip.';
        }

        // Create a zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });

        const stream = new PassThrough();

        // Queue files for zipping
        for (const file of files) {
            const fileStream = await getFileStream(sourceBucket, file.Key);
            archive.append(fileStream, { name: file.Key });
        }

        // Finalize the archive
        archive.finalize();

        // Upload the zip file to the output bucket
        const uploadResult = await s3.send(new PutObjectCommand({
            Bucket: outputBucket,
            Key: outputFileName,
            Body: stream,
            ContentType: 'application/zip'
        }));

        archive.pipe(stream);

        // Update Job from '1 - In Progress' to '2 - Completed'
        await supabase.from("be_jobs").update({ status: 2, updated_at: (new Date()).toISOString() }).eq("batchId", payload.batchId).select();

        return `Zip file created and uploaded successfully: ${uploadResult.Key}`;
    } catch (error) {
        console.error('Error:', error);
        return error.message;
    }
};

// Helper function to get a readable stream from S3
async function getFileStream(bucket, key) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { createReadStream } = require('stream');

    const downloadCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const { Body } = await s3.send(downloadCommand);
    return Body instanceof createReadStream ? Body : Body.createReadStream();
}
