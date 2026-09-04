import { S3Client } from "@aws-sdk/client-s3";

let client;

// Reused across requests in the same serverless instance instead of
// reconnecting every time the Run button is pressed.
export function getS3Client() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}
