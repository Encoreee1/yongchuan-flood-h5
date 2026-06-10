/* ============================================
   p3.js — 寻找救援道具交互
   交互1: 点击杂物热点 → 杂物消失 → 找到哨子
   交互2: 滑动清理 → 露出被困人员
   ============================================ */

function initP3() {
  const slide = document.querySelector('.p3-slide');
  if (!slide) return;

  let clearedCount = 0;
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

  function pickUpSwipe() {
    foundWhistle.style.display = 'none';
    if (whistleHotspot) whistleHotspot.style.display = 'none';
    hintText.textContent = '哨子已拾取！滑动清除障碍';
    swipeZone.style.display = 'block';
    AudioEngine.playClick();
    initSwipe();
  }

  // === 交互1: 点击杂物 ===
  hotspots.forEach(hotspot => {
    function handleClick(e) {
      e.preventDefault();
      e.stopPropagation();
      const itemId = hotspot.dataset.item;
      if (!itemId || hotspot.style.display === 'none') return;
      if (debrisItems[itemId]) debrisItems[itemId].classList.add('cleared');
      hotspot.style.display = 'none';
      clearedCount++;
      progressEl.textContent = `${clearedCount}/3 杂物已清理`;
      AudioEngine.playClick();
      if (clearedCount >= 3) revealWhistle();
    }
    hotspot.addEventListener('click', handleClick);
    hotspot.addEventListener('touchend', handleClick);
  });

  function revealWhistle() {
    foundWhistle.style.display = 'block';
    if (whistleHotspot) whistleHotspot.style.display = 'block';
    hintText.textContent = '找到了！应急求救哨 🪈';

    foundWhistle.addEventListener('click', pickUpSwipe, { once: true });
    foundWhistle.addEventListener('touchend', pickUpSwipe, { once: true });
    if (whistleHotspot) {
      whistleHotspot.addEventListener('click', pickUpSwipe, { once: true });
      whistleHotspot.addEventListener('touchend', pickUpSwipe, { once: true });
    }
  }

  // === 交互2: 滑动清理 ===
  let swipeDragging = false;
  let swipeStartX = 0;
  let swipeCurrentLeft = 4;

  function initSwipe() {
    if (!swipeThumb || !swipeTrack) return;
    const maxLeft = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 4;

    function onStart(e) {
      if (swipeDone) return;
      swipeDragging = true;
      swipeStartX = (e.touches ? e.touches[0].clientX : e.clientX) - swipeCurrentLeft;
      swipeThumb.style.transition = 'none';
      if (e.cancelable) e.preventDefault();
    }

    function onMove(e) {
      if (!swipeDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      swipeCurrentLeft = Math.max(4, Math.min(maxLeft, clientX - swipeStartX));
      swipeThumb.style.left = swipeCurrentLeft + 'px';
      const progress = swipeCurrentLeft / maxLeft;
      swipeTrack.style.background = progress > 0.7 ? 'rgba(13, 144, 79, 0.3)' : 'rgba(255,255,255,0.1)';
    }

    function onEnd() {
      if (!swipeDragging) return;
      swipeDragging = false;
      swipeThumb.style.transition = 'left 0.3s ease';

      if (swipeCurrentLeft >= maxLeft * 0.75) {
        swipeThumb.style.left = maxLeft + 'px';
        swipeDone = true;
        const p = swipeZone.querySelector('p');
        if (p) { p.textContent = '✓ 障碍已清除！'; p.style.color = 'var(--c-success)'; }
        revealTrappedPerson();
        AudioEngine.playSuccess();
      } else {
        swipeCurrentLeft = 4;
        swipeThumb.style.left = '4px';
        swipeTrack.style.background = 'rgba(255,255,255,0.1)';
      }
    }

    swipeThumb.addEventListener('touchstart', onStart, { passive: false });
    swipeThumb.addEventListener('mousedown', onStart);
  }

  // 全局 move/end（滑动清理模式下生效）
  document.addEventListener('touchmove', (e) => { if (swipeDragging) e.preventDefault(); }, { passive: false });
  document.addEventListener('mousemove', (e) => {
    if (!swipeDragging) return;
    const maxLeft = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 4;
    const clientX = e.clientX;
    swipeCurrentLeft = Math.max(4, Math.min(maxLeft, clientX - swipeStartX));
    swipeThumb.style.left = swipeCurrentLeft + 'px';
    swipeTrack.style.background = swipeCurrentLeft / maxLeft > 0.7 ? 'rgba(13, 144, 79, 0.3)' : 'rgba(255,255,255,0.1)';
  });
  document.addEventListener('mouseup', () => {
    if (!swipeDragging) return;
    swipeDragging = false;
    const maxLeft = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 4;
    swipeThumb.style.transition = 'left 0.3s ease';
    if (swipeCurrentLeft >= maxLeft * 0.75) {
      swipeThumb.style.left = maxLeft + 'px';
      swipeDone = true;
      const p = swipeZone.querySelector('p');
      if (p) { p.textContent = '✓ 障碍已清除！'; p.style.color = 'var(--c-success)'; }
      revealTrappedPerson();
      AudioEngine.playSuccess();
    } else {
      swipeCurrentLeft = 4;
      swipeThumb.style.left = '4px';
      swipeTrack.style.background = 'rgba(255,255,255,0.1)';
    }
  });
  document.addEventListener('touchend', () => {
    if (!swipeDragging) return;
    swipeDragging = false;
    const maxLeft = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 4;
    swipeThumb.style.transition = 'left 0.3s ease';
    if (swipeCurrentLeft >= maxLeft * 0.75) {
      swipeThumb.style.left = maxLeft + 'px';
      swipeDone = true;
      const p = swipeZone.querySelector('p');
      if (p) { p.textContent = '✓ 障碍已清除！'; p.style.color = 'var(--c-success)'; }
      revealTrappedPerson();
      AudioEngine.playSuccess();
    } else {
      swipeCurrentLeft = 4;
      swipeThumb.style.left = '4px';
      swipeTrack.style.background = 'rgba(255,255,255,0.1)';
    }
  });
  document.addEventListener('touchcancel', () => {
    if (!swipeDragging) return;
    swipeDragging = false;
    swipeCurrentLeft = 4;
    swipeThumb.style.left = '4px';
    swipeThumb.style.transition = 'left 0.3s ease';
    swipeTrack.style.background = 'rgba(255,255,255,0.1)';
  });

  function revealTrappedPerson() {
    trappedPerson.style.display = 'block';
    hintText.textContent = '成功发现被困人员！准备救援';
    progressEl.textContent = '探索完成 ✓';
  }

  slide.addEventListener('pageActivated', () => {});
}

document.addEventListener('DOMContentLoaded', initP3);
