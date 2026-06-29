// 一次性脚本: 把 /opt/damai/public/case/* + poster/ 上传到 OSS
// 跑法: cd /opt/damai && node scripts/upload-cases-to-oss.mjs
// 06-29 16:15 — 释放 server 3.6G 磁盘
// 用 server .env.local 的 ALIYUN_OSS_* env

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

// 读 .env.local
const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const require = createRequire(import.meta.url);
const OSS = require("ali-oss");  // ali-oss 6.23 CJS 直接 export constructor, 不用 .default

const REGION = process.env.ALIYUN_OSS_REGION || "oss-cn-hangzhou";
const BUCKET = process.env.ALIYUN_OSS_BUCKET || "damai-zlh-prod";
const OSS_KEY_PREFIX = "case"; // OSS 路径前缀 (跟 server public/case 对齐)

const client = new OSS({
  region: REGION,
  bucket: BUCKET,
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
});

const LOCAL_DIR = "/opt/damai/public/case";

async function uploadDir(localSubdir, ossSubdir, contentType) {
  const localPath = join(LOCAL_DIR, localSubdir);
  let files;
  try {
    files = await readdir(localPath);
  } catch (e) {
    console.log(`  skip ${localPath}: ${e.message}`);
    return 0;
  }

  let uploaded = 0;
  let bytes = 0;
  for (const f of files) {
    const localFile = join(localPath, f);
    const s = await stat(localFile);
    if (!s.isFile()) continue;
    const ossKey = `${OSS_KEY_PREFIX}/${ossSubdir ? ossSubdir + "/" : ""}${f}`;
    try {
      const result = await client.put(ossKey, localFile, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
      console.log(`  ✓ ${ossKey} (${(s.size / 1024 / 1024).toFixed(1)}MB) → ${result.url}`);
      uploaded++;
      bytes += s.size;
    } catch (e) {
      console.error(`  ✗ ${ossKey}: ${e.message}`);
    }
  }
  return { uploaded, bytes };
}

console.log(`=== upload cases to oss://${BUCKET}/${OSS_KEY_PREFIX}/ ===\n`);

console.log("--- 1. mp4 videos ---");
const videos = await uploadDir(".", "", "video/mp4");  // 本地 "." 直接列, OSS 不加 subdir
console.log(`  total: ${videos.uploaded} files, ${(videos.bytes / 1024 / 1024).toFixed(1)}MB\n`);

console.log("--- 2. poster jpg ---");
const posters = await uploadDir("poster", "poster", "image/jpeg");
console.log(`  total: ${posters.uploaded} files, ${(posters.bytes / 1024).toFixed(1)}KB\n`);

const totalBytes = videos.bytes + posters.bytes;
console.log(`✓ done: ${videos.uploaded + posters.uploaded} files, ${(totalBytes / 1024 / 1024).toFixed(1)}MB uploaded`);
console.log(`  base url: https://${BUCKET}.${REGION}.aliyuncs.com/${OSS_KEY_PREFIX}/`);
