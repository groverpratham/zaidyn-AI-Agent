import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "../../lib/s3Client";
import { detectDelimiterAndSchema } from "../../lib/fileInspector";
import { buildIngestionConfig, toS3Key } from "../../lib/configBuilder";

// We only need the first chunk of the file to see the header row and a
// handful of data rows — no reason to download the whole thing.
const SAMPLE_BYTES = 65536;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const { filePath, fileName } = req.body || {};

  if (!filePath || !fileName) {
    return res
      .status(400)
      .json({ success: false, message: "File Path and File Name are both required." });
  }

  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    return res.status(500).json({
      success: false,
      message: "S3_BUCKET_NAME isn't set on the server yet — add it to your environment variables.",
    });
  }

  const key = toS3Key(filePath, fileName);

  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=0-${SAMPLE_BYTES - 1}`,
    });

    const response = await client.send(command);
    const sampleText = await streamToString(response.Body);

    const { delimiter, dataSetSchema } = detectDelimiterAndSchema(sampleText, true);
    const config = buildIngestionConfig({ filePath, fileName, delimiter, dataSetSchema });

    return res.status(200).json({ success: true, data: config });
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode || 500;
    const message =
      err.name === "NoSuchKey" || status === 404
        ? `No file found at s3://${bucket}/${key} — double check the path and name.`
        : err.message || "Couldn't read that file from S3.";
    return res.status(status).json({ success: false, message });
  }
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}
