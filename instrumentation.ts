export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.ARMS_LICENSE_KEY) return;
    try {
      const arms = require("aliyun-arms-nodejs-sdk");
      arms.start({
        pid: process.env.ARMS_LICENSE_KEY,
        appId: "damai-server",
      });
    } catch (e) {
      console.warn("[ARMS] init failed:", e.message);
    }
  }
}
