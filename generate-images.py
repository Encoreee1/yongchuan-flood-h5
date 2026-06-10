"""
generate-images.py — 阿里云百炼 · 通义万相 AI 图片生成
生成 4 张 H5 所需场景图
使用免费额度，分辨率 1200×2133
"""

import os
import sys
import json
import time
import base64
import urllib.request
import urllib.error

# === 配置 ===
API_KEY = "sk-11805d3c59234b4ca4e1c5b407e7215d"
BASE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "assets", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# === 4 张图片的 Prompt ===
IMAGES = [
    {
        "name": "cover-bg",
        "prompt": (
            "暴雨中的城市夜景，浓密乌云笼罩天际，倾盆大雨冲刷街道，积水反射路灯的橙光，"
            "远处建筑轮廓朦胧，画面充满紧张氛围但保留希望感。"
            "竖屏构图，写实风格，色调以深蓝、灰黑为主，点缀暖橙灯光的对比。"
            "适合作为新闻H5封面背景，预留上方30%区域放标题文字。"
        ),
        "desc": "封面背景：暴雨城市夜景"
    },
    {
        "name": "debris-scene",
        "prompt": (
            "洪水过后的室内废墟场景，家具杂物散乱堆叠，木板、碎石、布料混杂，"
            "画面中有几个明显的物品（背包、手电筒、水壶、急救包）半埋在杂物中，"
            "其中一个银色哨子微微反光，吸引注意力。"
            "光线从破损的窗户射入，营造搜寻探索的氛围。"
            "竖屏构图，写实风格，色调灰褐为主，局部高光引导视线。"
        ),
        "desc": "杂物废墟场景：寻找救援道具"
    },
    {
        "name": "rescue-scene",
        "prompt": (
            "洪水救援现场，救援人员在泥泞中清理道路，倒塌的树木和碎石挡住去路，"
            "远处有被困人员等待救援，天空开始放晴，一缕阳光穿透云层。"
            "画面传递紧张但有序的救援氛围，突出团结与希望。"
            "竖屏构图，半写实风格，色彩层次丰富，上部天空渐亮，下部泥泞深色。"
            "适合作为互动游戏的操作背景。"
        ),
        "desc": "救援现场：核心救援游戏背景"
    },
    {
        "name": "award-bg",
        "prompt": (
            "温暖庄重的荣誉表彰场景背景，金色光芒从中心扩散，"
            "柔和的暖色调（金色、米白、淡棕），有飘落的花瓣或彩带元素，"
            "画面简洁优雅，中间区域留白适合放置奖状或文字。"
            "竖屏构图，温馨风格，传递完成救援任务后的成就感和温暖。"
        ),
        "desc": "奖状背景：授旗领奖页面"
    },
]


def generate_image(prompt, output_path, max_retries=3):
    """调用百炼通义万相 API 生成图片"""
    data = json.dumps({
        "model": "wanx2.0-t2i-turbo",
        "input": {
            "prompt": prompt
        },
        "parameters": {
            "size": "720*1280",
            "n": 1,
            "style": "<auto>"
        }
    }).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(BASE_URL, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))

            if result.get("output", {}).get("task_status") == "FAILED":
                print(f"  ✗ 任务失败: {result.get('output', {}).get('message', '未知错误')}")
                return False

            task_id = result.get("output", {}).get("task_id")
            if not task_id:
                print(f"  ✗ 未获取到 task_id: {result}")
                return False

            print(f"  任务已提交: {task_id}，等待生成...")

            # 轮询等待结果
            TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks"
            for _ in range(30):  # 最多等 150 秒
                time.sleep(5)
                status_url = f"{TASK_URL}/{task_id}"
                req2 = urllib.request.Request(status_url, headers=headers)
                with urllib.request.urlopen(req2, timeout=30) as resp2:
                    result2 = json.loads(resp2.read().decode("utf-8"))

                task_status = result2.get("output", {}).get("task_status")
                print(f"  状态: {task_status}")

                if task_status == "SUCCEEDED":
                    # 获取图片 URL 并下载
                    results = result2.get("output", {}).get("results", [])
                    if not results:
                        print("  ✗ 无结果")
                        return False
                    img_url = results[0].get("url")
                    if not img_url:
                        print("  ✗ 无图片 URL")
                        return False

                    print(f"  下载图片: {img_url}")
                    urllib.request.urlretrieve(img_url, output_path)
                    file_size = os.path.getsize(output_path) / 1024
                    print(f"  ✓ 已保存: {output_path} ({file_size:.0f} KB)")
                    return True

                elif task_status == "FAILED":
                    print(f"  ✗ 生成失败: {result2.get('output', {}).get('message', '')}")
                    return False

            print("  ✗ 等待超时")
            return False

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            print(f"  HTTP {e.code}: {err_body}")
            if attempt < max_retries - 1:
                wait = (attempt + 1) * 5
                print(f"  重试中...（{wait}s 后）")
                time.sleep(wait)
        except Exception as e:
            print(f"  异常: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)

    return False


def main():
    print("=" * 60)
    print("  通义万相 AI 图片生成")
    print("  生成 4 张 H5 场景图")
    print("=" * 60)

    success = 0
    for i, img in enumerate(IMAGES, 1):
        print(f"\n[{i}/4] {img['desc']}")
        print(f"  文件: {img['name']}.png")
        output_path = os.path.join(OUTPUT_DIR, f"{img['name']}.png")

        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            print(f"  ⚠ 已存在，跳过")
            success += 1
            continue

        if generate_image(img["prompt"], output_path):
            success += 1
        else:
            print(f"  ⚠ 生成失败，稍后可重试")

        # 免费额度限速
        if i < len(IMAGES):
            time.sleep(2)

    print(f"\n{'=' * 60}")
    print(f"  完成: {success}/{len(IMAGES)} 张图片生成成功")
    print(f"  输出目录: {OUTPUT_DIR}")
    print("=" * 60)

    return 0 if success == len(IMAGES) else 1


if __name__ == "__main__":
    sys.exit(main())
