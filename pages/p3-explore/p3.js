/* ============================================
   p3.js — 寻找救援道具交互
   交互1: 点击杂物热点 → 杂物消失 → 找到哨子
   交互2: 滑动清理 → 露出被困人员
   ============================================ */

function initP3() {
  const slide = document.querySelector('.p3-slide');
  if (!slide) return;

  let clearedCount = 0;
  let whistleFound = false;
  let swipeDone = false;

  const hotspots = slide.querySelectorAll('.p3-hotspot[data-item^="debris"]');
  const debrisItems = {
    debris1: slide.querySelector('#debris1'),
    debris2: slide.querySelector('#debris2'),
    debris3: slide.querySelector('#debris3'),
  };
  const whistleHotspot = slide.querySelector('.p3-hotspot[data-item="whistle"]');
  const foundWhistle = slide.querySelector('#foundWhistle');
  const trappedPerson = slide.querySelector('#trappedPerson');
  const hintText = slide.querySelector('.p3-hint-text');
  const progressEl = slide.querySelector('#p3Progress');
  const swipeZone = slide.querySelector('#p3SwipeZone');
  const swipeThumb = slide.querySelector('#swipeThumb');
  const swipeTrack = slide.querySelector('#swipeTrack');

  // === 交互1: 点击杂物 ===
  hotspots.forEach(hotspot => {
    function handleClick(e) {
      e.preventDefault();
      e.stopPropagation();

      const itemId = hotspot.dataset.item;
      if (!itemId || hotspot.style.display === 'none') return;

      // 杂物消失
      if (debrisItems[itemId]) {
        debrisItems[itemId].classList.add('cleared');
      }
      hotspot.style.display = 'none';
      clearedCount++;
      progressEl.textContent = `${clearedCount}/3 杂物已清理`;
      AudioEngine.playClick();

      // 检查是否全部清理
      if (clearedCount >= 3) {
        revealWhistle();
      }
    }

    hotspot.addEventListener('click', handleClick);
    hotspot.addEventListener('touchend', handleClick);
  });

  function revealWhistle() {
    whistleFound = true;
    foundWhistle.style.display = 'block';
    whistleHotspot.style.display = 'block';
    hintText.textContent = '找到了！应急求救哨 🪈';
    AudioEngine.playSuccess();

    // 点击哨子拾取（自动）
    function pickUpWhistle(e) {
      e.preventDefault();
      e.stopPropagation();
      foundWhistle.style.display = 'none';
      whistleHotspot.style.display = 'none';
      hintText.textContent = '哨子已拾取！滑动清除障碍';
      swipeZone.style.display = 'block';
      AudioEngine.playClick();

      // 初始化滑动
      initSwipe();
    }

    foundWhistle.addEventListener('click', pickUpWhistle);
    foundWhistle.addEventListener('touchend', pickUpWhistle);
    whistleHotspot.addEventListener('click', pickUpWhistle);
    whistleHotspot.addEventListener('touchend', pickUpWhistle);
  }

  // === 交互2: 滑动清理 ===
  function initSwipe() {
    if (!swipeThumb || !swipeTrack) return;

    let isDragging = false;
    let startX = 0;
    let currentLeft = 4;
    const maxLeft = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 4;

    function onDragStart(e) {
      isDragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX) - currentLeft;
      swipeThumb.style.transition = 'none';
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      currentLeft = Math.max(4, Math.min(maxLeft, clientX - startX));
      swipeThumb.style.left = currentLeft + 'px';

      // 接近完成时改变颜色
      const progress = currentLeft / maxLeft;
      if (progress > 0.7) {
        swipeTrack.style.background = 'rgba(13, 144, 79, 0.3)';
      } else {
        swipeTrack.style.background = 'rgba(255,255,255,0.1)';
      }
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      swipeThumb.style.transition = 'left 0.3s ease';

      if (currentLeft >= maxLeft * 0.75) {
        // 完成！
        swipeThumb.style.left = maxLeft + 'px';
        swipeDone = true;
        swipeZone.querySelector('p').textContent = '✓ 障碍已清除！';
        swipeZone.querySelector('p').style.color = 'var(--c-success)';
        revealTrappedPerson();
        AudioEngine.playSuccess();
      } else {
        // 弹回
        currentLeft = 4;
        swipeThumb.style.left = '4px';
        swipeTrack.style.background = 'rgba(255,255,255,0.1)';
      }
    }

    // Touch events
    swipeThumb.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', (e) => {
      if (isDragging) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      if (isDragging) onDragMove(e);
    });
    document.addEventListener('touchend', onDragEnd);

    // Mouse events
    swipeThumb.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', (e) => {
      if (isDragging) onDragMove(e);
    });
    document.addEventListener('mouseup', onDragEnd);
  }

  function revealTrappedPerson() {
    trappedPerson.style.display = 'block';
    hintText.textContent = '成功发现被困人员！准备救援';
    progressEl.textContent = '探索完成 ✓';
  }

  // === 页面激活时重置 ===
  slide.addEventListener('pageActivated', () => {
    // 可在此重置状态（如果需要重玩）
  });
}

document.addEventListener('DOMContentLoaded', initP3);
