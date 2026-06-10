/* ============================================
   p1.js — 封面逻辑
   下滑提示动画、首屏加载
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const scrollHint = document.querySelector('.p1-slide .scroll-hint');

  if (scrollHint) {
    // 用户首次滑动后隐藏提示
    function hideHint() {
      scrollHint.style.opacity = '0';
      scrollHint.style.transition = 'opacity 0.5s ease';
      setTimeout(() => { scrollHint.style.display = 'none'; }, 500);
    }

    document.addEventListener('touchstart', hideHint, { once: true });
    document.addEventListener('wheel', hideHint, { once: true });
  }
});
