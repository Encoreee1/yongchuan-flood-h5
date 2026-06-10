/* ============================================
   p2.js — 灾情页逻辑
   柱状图动画（页面激活时触发）
   ============================================ */

function initP2() {
  const slide = document.querySelector('.p2-slide');
  if (!slide) return;

  let animated = false;

  function animateChart() {
    if (animated) return;
    animated = true;

    const bars = slide.querySelectorAll('.chart-bar');
    bars.forEach((bar, i) => {
      const targetHeight = bar.style.height || bar.getAttribute('style')?.match(/height:\s*(\d+)px/)?.[1];
      const current = parseInt(targetHeight || bar.offsetHeight);
      bar.style.height = '0px';
      bar.style.transition = 'none';

      requestAnimationFrame(() => {
        bar.style.transition = `height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 0.2}s`;
        bar.style.height = targetHeight || current + 'px';
      });
    });
  }

  slide.addEventListener('pageActivated', animateChart);

  // 如果是首屏已激活，也触发
  if (window.H5_SWIPER && window.H5_SWIPER.activeIndex === 1) {
    setTimeout(animateChart, 500);
  }
}

document.addEventListener('DOMContentLoaded', initP2);
