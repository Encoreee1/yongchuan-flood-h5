"""
build.py — 构建脚本
将模块化的页面文件合并为单个 index.html
- 读 template.html 骨架
- 注入 6 个页面 HTML 片段
- 合并所有 CSS / JS
- base64 内联图片
- 输出 index.html
"""

import os
import re
import base64
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# === 文件清单 ===
CSS_FILES = [
    "shared/base.css",
    "shared/mobile.css",
    "shared/desktop.css",
    "pages/p1-cover/p1.css",
    "pages/p2-disaster/p2.css",
    "pages/p3-explore/p3.css",
    "pages/p4-rescue/p4.css",
    "pages/p5-award/p5.css",
    "pages/p6-summary/p6.css",
]

JS_FILES = [
    "shared/utils.js",
    "shared/audio.js",
    "pages/p1-cover/p1.js",
    "pages/p2-disaster/p2.js",
    "pages/p3-explore/p3.js",
    "pages/p4-rescue/p4.js",
    "pages/p5-award/p5.js",
    "pages/p6-summary/p6.js",
]

PAGES = {
    "PAGE_1_PLACEHOLDER": "pages/p1-cover/p1.html",
    "PAGE_2_PLACEHOLDER": "pages/p2-disaster/p2.html",
    "PAGE_3_PLACEHOLDER": "pages/p3-explore/p3.html",
    "PAGE_4_PLACEHOLDER": "pages/p4-rescue/p4.html",
    "PAGE_5_PLACEHOLDER": "pages/p5-award/p5.html",
    "PAGE_6_PLACEHOLDER": "pages/p6-summary/p6.html",
}

IMAGE_DIR = "assets/images"
EXPECTED_IMAGES = ["cover-bg.png", "debris-scene.png", "rescue-scene.png", "award-bg.png"]


def read_file(path):
    """读取文件内容"""
    full = os.path.join(BASE_DIR, path)
    if not os.path.exists(full):
        print(f"  ⚠ 文件不存在: {path}")
        return ""
    with open(full, "r", encoding="utf-8") as f:
        return f.read()


def merge_css():
    """合并所有 CSS 文件"""
    result = []
    for path in CSS_FILES:
        content = read_file(path)
        if content:
            result.append(f"/* === {path} === */\n{content}")
    return "\n\n".join(result)


def merge_js():
    """合并所有 JS 文件，包裹在 DOMContentLoaded 中统一初始化"""
    parts = []
    for path in JS_FILES:
        content = read_file(path)
        if content:
            # 去掉各文件自己的 DOMContentLoaded 包装，统一在外部调用
            # 保留函数定义和逻辑
            parts.append(f"// === {path} ===\n{content}")
    return "\n\n".join(parts)


def get_page_html(filename):
    """读取页面 HTML 片段"""
    return read_file(filename)


def inline_images_in_css(css_content):
    """将 CSS 中的图片引用替换为 base64（可选，供后期手动调用）"""
    # 查找 background-image: url(...) 中的本地路径
    # 当前先保留 CSS gradient 作为默认，AI 图片通过 HTML 的 img 标签加载
    return css_content


def embed_images_as_js():
    """将图片转为 JS 变量（base64），在运行时动态注入到 DOM"""
    img_dir = os.path.join(BASE_DIR, IMAGE_DIR)
    lines = []
    lines.append("// === 内联图片 base64 ===")
    lines.append("window.H5_IMAGES = {};")

    for name in EXPECTED_IMAGES:
        path = os.path.join(img_dir, name)
        if os.path.exists(path):
            with open(path, "rb") as f:
                data = base64.b64encode(f.read()).decode("ascii")
            ext = os.path.splitext(name)[1].lower()
            mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}.get(ext, "image/png")
            var_name = name.replace("-", "_").replace(".", "_")
            lines.append(f"window.H5_IMAGES['{name}'] = 'data:{mime};base64,{data}';")
            size_kb = len(data) * 3 / 4 / 1024
            print(f"  ✓ {name} ({size_kb:.0f} KB)")
        else:
            print(f"  ⚠ 图片不存在: {name}")

    return "\n".join(lines)


def apply_images_js():
    """生成运行时注入图片到背景的 JS 代码"""
    return """
// === 图片注入：将 base64 图片设置到各页背景 ===
(function applyImages() {
  if (!window.H5_IMAGES) return;

  var mapping = {
    'cover-bg.png': '.p1-bg',
    'debris-scene.png': '.p3-bg',
    'rescue-scene.png': '.p4-bg',
    'award-bg.png': '.p5-bg'
  };

  Object.keys(mapping).forEach(function(name) {
    var selector = mapping[name];
    var url = window.H5_IMAGES[name];
    if (url) {
      var els = document.querySelectorAll(selector);
      els.forEach(function(el) {
        el.style.backgroundImage = 'url(' + url + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      });
    }
  });
})();
"""


def build():
    print("=" * 60)
    print("  H5 构建脚本 — 合并模块化文件 → index.html")
    print("=" * 60)

    # 1. 读模板
    print("\n[1/5] 读取模板...")
    template = read_file("template.html")
    print("  ✓ template.html")

    # 2. 注入页面 HTML
    print("\n[2/5] 注入页面 HTML...")
    for placeholder, page_file in PAGES.items():
        html = get_page_html(page_file)
        # 去除注释标记，保留内容
        html_clean = html.strip()
        if html_clean:
            template = template.replace(f"<!-- {placeholder} -->", html_clean)
            print(f"  ✓ {page_file}")
        else:
            print(f"  ⚠ {page_file} 为空")

    # 3. 合并 CSS
    print("\n[3/5] 合并 CSS...")
    css = merge_css()
    css = inline_images_in_css(css)
    template = template.replace("<!-- === CSS_PLACEHOLDER === -->", f"<style>\n{css}\n</style>")
    print(f"  ✓ {len(CSS_FILES)} 个 CSS 文件已合并 ({len(css)} 字符)")

    # 4. 合并 JS + 内联图片
    print("\n[4/5] 合并 JS + 内联图片...")
    js = merge_js()
    img_js = embed_images_as_js()
    apply_js = apply_images_js()
    full_js = img_js + "\n\n" + apply_js + "\n\n" + js

    template = template.replace("<!-- === JS_PLACEHOLDER === -->", f"<script>\n{full_js}\n</script>")
    print(f"  ✓ {len(JS_FILES)} 个 JS 文件已合并 ({len(full_js)} 字符)")

    # 5. 输出
    print("\n[5/5] 输出 index.html...")
    output_path = os.path.join(BASE_DIR, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(template)
    total_kb = os.path.getsize(output_path) / 1024
    print(f"  ✓ index.html ({total_kb:.0f} KB)")

    print(f"\n{'=' * 60}")
    print(f"  构建完成！")
    print(f"  输出: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    build()
