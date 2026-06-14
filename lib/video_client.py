"""
天禧派视频助手 — 视频生成客户端
支持多模型：即梦 / Seedance 2.0 / 可灵 / Vidu
统一异步任务 + 轮询 + 下载 + 错误处理
"""

import os
import sys
import time
import json
import httpx
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from dotenv import load_dotenv

# 加载 .env
load_dotenv()

# ============== 配置 ==============

@dataclass
class VideoResult:
    task_id: str
    status: str
    video_url: Optional[str] = None
    error: Optional[str] = None
    duration_sec: Optional[int] = None
    model: str = ""
    elapsed_sec: float = 0.0
    raw: dict = field(default_factory=dict)


# ============== 火山方舟客户端（即梦 + Seedance） ==============

class VolcengineClient:
    """火山方舟 — 即梦 / Seedance 2.0"""

    def __init__(self):
        self.api_key = os.getenv("VOLC_API_KEY")  # 形如 ark-xxxxx
        if not self.api_key:
            raise ValueError("未设置 VOLC_API_KEY，请检查 .env")
        self.base = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def create_task(
        self,
        model: str,
        text: str,
        image_urls: list[str] = None,
        video_urls: list[str] = None,
        audio_urls: list[str] = None,
        ratio: str = "16:9",
        duration: int = 11,
        watermark: bool = False,
        generate_audio: bool = True,
    ) -> str:
        """创建视频生成任务，返回 task_id"""
        content = [{"type": "text", "text": text}]

        for i, url in enumerate(image_urls or []):
            content.append({
                "type": "image_url",
                "image_url": {"url": url},
                "role": "reference_image",
            })
        for url in video_urls or []:
            content.append({
                "type": "video_url",
                "video_url": {"url": url},
                "role": "reference_video",
            })
        for url in audio_urls or []:
            content.append({
                "type": "audio_url",
                "audio_url": {"url": url},
                "role": "reference_audio",
            })

        payload = {
            "model": model,
            "content": content,
            "generate_audio": generate_audio,
            "ratio": ratio,
            "duration": duration,
            "watermark": watermark,
        }

        print(f"  📤 POST {self.base}")
        print(f"  📋 model={model}, duration={duration}s, ratio={ratio}")

        with httpx.Client(timeout=30) as client:
            r = client.post(self.base, headers=self.headers, json=payload)
            r.raise_for_status()
            data = r.json()
            task_id = data.get("id") or data.get("task_id")
            if not task_id:
                raise RuntimeError(f"未拿到 task_id: {data}")
            print(f"  ✅ task_id = {task_id}")
            return task_id

    def poll_task(self, task_id: str, timeout_sec: int = 300, interval_sec: int = 5) -> VideoResult:
        """轮询任务状态"""
        start = time.time()
        url = f"{self.base}/{task_id}"
        print(f"  ⏳ 轮询 {url}")

        with httpx.Client(timeout=30) as client:
            while time.time() - start < timeout_sec:
                r = client.get(url, headers=self.headers)
                r.raise_for_status()
                data = r.json()
                status = data.get("status", "unknown")
                elapsed = int(time.time() - start)
                print(f"  [{elapsed:>3}s] status = {status}")

                if status == "succeeded":
                    video_url = (
                        data.get("content", {}).get("video_url")
                        or data.get("output", {}).get("video_url")
                        or data.get("video_url")
                    )
                    return VideoResult(
                        task_id=task_id,
                        status="succeeded",
                        video_url=video_url,
                        elapsed_sec=time.time() - start,
                        raw=data,
                    )
                if status in ("failed", "cancelled"):
                    err = data.get("error", {}).get("message") or str(data)
                    return VideoResult(
                        task_id=task_id,
                        status=status,
                        error=err,
                        elapsed_sec=time.time() - start,
                        raw=data,
                    )

                time.sleep(interval_sec)

        return VideoResult(
            task_id=task_id,
            status="timeout",
            error=f"超过 {timeout_sec}s 未完成",
            elapsed_sec=time.time() - start,
        )

    def download(self, url: str, save_path: str) -> str:
        """下载视频到本地"""
        print(f"  ⬇️  下载到 {save_path}")
        with httpx.Client(timeout=120, follow_redirects=True) as client:
            with client.stream("GET", url) as resp:
                resp.raise_for_status()
                with open(save_path, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=8192):
                        f.write(chunk)
        size_mb = Path(save_path).stat().st_size / 1024 / 1024
        print(f"  ✅ 下载完成 {size_mb:.1f} MB")
        return save_path

    def generate(
        self,
        model: str,
        text: str,
        out_dir: str = "/opt/data/projects/tianxipai-video/output",
        **kwargs,
    ) -> VideoResult:
        """一键生成：创建任务 + 轮询 + 下载"""
        Path(out_dir).mkdir(parents=True, exist_ok=True)

        # 重试 3 次
        for attempt in range(3):
            try:
                task_id = self.create_task(model=model, text=text, **kwargs)
                result = self.poll_task(task_id)
                if result.status == "succeeded" and result.video_url:
                    fname = f"{model}_{task_id[:8]}.mp4"
                    save_path = str(Path(out_dir) / fname)
                    self.download(result.video_url, save_path)
                    result.raw = {**result.raw, "saved_to": save_path}
                    return result
                elif result.status in ("failed", "cancelled"):
                    if attempt < 2:
                        print(f"  ⚠️  失败，重试 {attempt+1}/2: {result.error}")
                        time.sleep(2)
                        continue
                    return result
            except Exception as e:
                if attempt < 2:
                    print(f"  ⚠️  异常，重试 {attempt+1}/2: {e}")
                    time.sleep(2)
                    continue
                return VideoResult(task_id="", status="exception", error=str(e))

        return result


# ============== 演示用法 ==============

if __name__ == "__main__":
    # 从 .env 读 API key
    if not os.getenv("VOLC_API_KEY"):
        print("❌ 缺少 VOLC_API_KEY")
        print("   在 .env 加一行：VOLC_API_KEY=ark-你的key")
        sys.exit(1)

    client = VolcengineClient()

    # 示例：调用 Seedance 2.0 生成 11 秒视频
    # 用的是火山方舟官方示例（果茶广告）
    text_prompt = """
    全程使用视频1的第一视角构图，全程使用音频1作为背景音乐。
    第一人称视角果茶宣传广告，seedance牌「苹苹安安」苹果果茶限定款；
    首帧为图片1，你的手摘下一颗带晨露的阿克苏红苹果，轻脆的苹果碰撞声；
    2-4 秒：快速切镜，你的手将苹果块投入雪克杯，加入冰块与茶底，用力摇晃，
    冰块碰撞声与摇晃声卡点轻快鼓点，背景音：「鲜切现摇」；
    4-6 秒：第一人称成品特写，分层果茶倒入透明杯，你的手轻挤奶盖在顶部铺展，
    在杯身贴上粉红包标，镜头拉近看奶盖与果茶的分层纹理；
    6-8 秒：第一人称手持举杯，你将图片2中的果茶举到镜头前
    （模拟递到观众面前的视角），杯身标签清晰可见，背景音「来一口鲜爽」，
    尾帧定格为图片2。背景声音统一为女生音色。
    """

    result = client.generate(
        model="doubao-seedance-2-0-260128",
        text=text_prompt,
        image_urls=[
            "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic1.jpg",
            "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic2.jpg",
        ],
        video_urls=[
            "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_tea_video1.mp4",
        ],
        audio_urls=[
            "https://ark-project.tos-cn-beijing.volces.com/doc_audio/r2v_tea_audio1.mp3",
        ],
        ratio="16:9",
        duration=11,
        generate_audio=True,
    )

    print()
    print("=" * 50)
    print(f"📊 最终结果")
    print(f"   状态: {result.status}")
    print(f"   耗时: {result.elapsed_sec:.1f}s")
    if result.video_url:
        print(f"   视频: {result.video_url}")
    if result.error:
        print(f"   错误: {result.error}")
    if "saved_to" in result.raw:
        print(f"   本地: {result.raw['saved_to']}")
