# ZAIDYN S3 Ingestion Config Generator

A small internal tool: give it a file path + file name in S3, it reads the
file, works out the delimiter and column schema, and generates the ingestion
config JSON automatically.

```
File Path + File Name  →  [Run]  →  reads file in S3  →  generated JSON
```

---

## 1. What's in here

```
zaidyn-s3-tool/
  pages/
    index.js            ← the page you see (form + result panel)
    api/
      generate-json.js   ← reads the S3 file, builds the JSON
      forward-json.js    ← placeholder for step 2 (sending JSON onward)
  lib/
    s3Client.js          ← AWS S3 connection
    fileInspector.js     ← delimiter + column type detection
    configBuilder.js     ← assembles the final JSON shape
  styles/globals.css
  .env.local.example     ← copy to .env.local and fill in
```

Nothing here talks to AWS from the browser. The browser only ever calls
`/api/generate-json` on your own server; that server-side code is the only
place your AWS keys are used. This matters — AWS credentials should never
reach client-side JavaScript.

---

## 2. Run it locally

You need [Node.js](https://nodejs.org) 18 or later installed.

```bash
# 1. unzip the project, then inside the folder:
npm install

# 2. copy the env template and fill in your real values
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

(See section 4 below for how to get an AWS key scoped just to this.)

```bash
# 3. start it
npm run dev
```

Open **http://localhost:3000** — you should see the page. Type a File Path
and File Name for a file that actually exists in your bucket, hit **Run**.

---

## 3. Hosting it for free (Vercel)

Vercel is built by the Next.js team, has a free "Hobby" tier, and runs both
the page and the `/api/*` routes (as serverless functions) with no extra
setup.

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   # create an empty repo on github.com first, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. Go to **vercel.com** → sign up free with your GitHub account.
3. **Add New Project** → import the repo you just pushed.
4. Before deploying, open **Environment Variables** and add the same four
   values from your `.env.local`:
   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
5. Click **Deploy**. You'll get a live URL like `https://your-project.vercel.app`.
6. From now on, every `git push` to `main` redeploys automatically.

No cost at this scale — Hobby covers this comfortably.

---

## 4. AWS setup (least-privilege — don't hand out full S3 access)

Create an IAM user just for this tool, with a policy scoped to only the one
bucket and only read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

Steps in the AWS console: **IAM → Users → Create user → Attach policy
directly → paste the JSON above (as a custom policy) → create an access
key for that user (use case: "Application running outside AWS")**. Put that
key/secret into `.env.local` (locally) and into Vercel's environment
variables (in production). Rotate the key periodically.

---

## 5. How the detection works

- The API route reads only the **first 64 KB** of the file (an S3 range
  request), not the whole thing — plenty for a header row and a sample of
  data rows.
- It tries tab, comma, pipe, and semicolon as delimiters and picks whichever
  one splits every sampled line into the same number of fields.
- For each column, it looks at the sampled values to guess `integer`,
  `decimal`, `date`, or `string`.
- Everything else in the JSON (`ClientId`, `ProjectId`, `AdaptorName`, etc.)
  is filled in with the fixed values you specified. If those ever need to
  change, edit `lib/configBuilder.js` — it's the only file that assembles
  the final shape.

---

## 6. Wiring up the downstream API later

`pages/api/forward-json.js` already exists and is already wired to the
**Send to Pipeline** button on the page — it's just not pointed anywhere
yet. Once you have the other app's API spec:

1. Set `DOWNSTREAM_API_URL` (and `DOWNSTREAM_API_KEY` if it needs auth) in
   your environment variables.
2. If the other app expects a different request shape (custom headers, a
   wrapper object, etc.), that's the only file to edit.

No changes to the frontend should be needed for this step.

---

## 7. Making changes

- **Colors / logo / copy** → `pages/index.js`, inside the `<style jsx>`
  block at the bottom, or the `Logo()` component near the bottom of the
  same file.
- **Which fields go in the JSON, or their fixed values** → `lib/configBuilder.js`.
- **How delimiter/column-type detection works** → `lib/fileInspector.js`.
- **Add support for a file type other than delimited text** (e.g. fixed-width,
  Parquet) → extend `detectDelimiterAndSchema` in `lib/fileInspector.js`
  and branch on file extension in `pages/api/generate-json.js`.

After any change, just save the file — `npm run dev` hot-reloads
automatically. On Vercel, push to `main` and it redeploys.
