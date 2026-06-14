/**
 * 大脉视频生成客户端（TypeScript 版）
 * 调用火山方舟 API：即梦 / Seedance 2.0
 * 等价于 lib/video_client.py，但给 Next.js / Vercel serverless 用
 */

export type VideoResult = {
  taskId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "unknown";
  videoUrl?: string;
  error?: string;
  raw?: any;
};

export class VolcengineClient {
  private apiKey: string;
  private base = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";

  constructor() {
    this.apiKey = process.env.VOLC_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("未设置 VOLC_API_KEY（请在 Vercel 环境变量配置）");
    }
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  /** 创建视频生成任务，返回 task_id */
  async createTask(opts: {
    model: string;
    text: string;
    imageUrls?: string[];
    audioUrls?: string[];
    videoUrls?: string[];
    ratio?: string;
    duration?: number;
    watermark?: boolean;
    generateAudio?: boolean;
  }): Promise<string> {
    const content: any[] = [{ type: "text", text: opts.text }];

    for (const url of opts.imageUrls || []) {
      content.push({
        type: "image_url",
        image_url: { url },
        role: "reference_image",
      });
    }
    for (const url of opts.videoUrls || []) {
      content.push({
        type: "video_url",
        video_url: { url },
        role: "reference_video",
      });
    }
    for (const url of opts.audioUrls || []) {
      content.push({
        type: "audio_url",
        audio_url: { url },
        role: "reference_audio",
      });
    }

    const payload = {
      model: opts.model,
      content,
      generate_audio: opts.generateAudio ?? true,
      ratio: opts.ratio || "16:9",
      duration: opts.duration || 11,
      watermark: opts.watermark ?? false,
    };

    const r = await fetch(this.base, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`创建任务失败 (${r.status}): ${errText.slice(0, 200)}`);
    }

    const data = await r.json();
    const taskId = data.id || data.task_id;
    if (!taskId) {
      throw new Error(`响应里没 task_id: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return taskId;
  }

  /** 单次查询任务状态（Vercel serverless 短轮询用） */
  async pollTaskOnce(taskId: string): Promise<VideoResult> {
    const r = await fetch(`${this.base}/${taskId}`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!r.ok) {
      const errText = await r.text();
      return { taskId, status: "failed", error: `查询失败 (${r.status}): ${errText.slice(0, 200)}` };
    }
    const data = await r.json();
    const status = data.status || "unknown";
    const videoUrl =
      data?.content?.video_url ||
      data?.output?.video_url ||
      data?.video_url;

    if (status === "succeeded") {
      return { taskId, status: "succeeded", videoUrl, raw: data };
    }
    if (status === "failed" || status === "cancelled") {
      const err = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return { taskId, status, error: err, raw: data };
    }
    return { taskId, status, raw: data };
  }
}
