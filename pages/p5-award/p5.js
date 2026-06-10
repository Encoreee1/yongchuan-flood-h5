/* ============================================
   p5.js — 授旗领奖交互
   交互1: 点击提交 → 救援统计展示
   交互2: 滑动揭幕 → 荣誉奖状
   交互3: 点击分享 → CSS confetti
   ============================================ */

function initP5() {
  const slide = document.querySelector('.p5-slide');
  if (!slide) return;

  const phase1 = slide.querySelector('#p5Phase1');
  const phase2 = slide.querySelector('#p5Phase2');
  const phase3 = slide.querySelector('#p5Phase3');
  const submitBtn = slide.querySelector('#p5SubmitBtn');
  const unveilCover = slide.querySelector('#unveilCover');
  const shareBtn = slide.querySelector('#p5ShareBtn');

  // === 交互1: 点击提交 ===
  if (submitBtn) {
    function handleSubmit(e) {
      e.preventDefault();
      AudioEngine.playSuccess();
      phase1.style.display = 'none';
      phase2.style.display = 'flex';
    }
    submitBtn.addEventListener('click', handleSubmit);
    submitBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleSubmit(e);
    });
  }

  // === 交互2: 滑动揭幕 ===
  if (unveilCover) {
    let isDragging = false;
    let startY = 0;
    let currentOffset = 0;
    const container = slide.querySelector('#unveilContainer');
    const maxOffset = container ? container.offsetHeight * 0.85 : 170;

    function onDragStart(e) {
      isDragging = true;
      startY = (e.touches ? e.touches[0].clientY : e.clientY) - currentOffset;
      unveilCover.style.transition = 'none';
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      currentOffset = Math.max(0, Math.min(maxOffset, clientY - startY));
      unveilCover.style.transform = `translateY(${currentOffset}px)`;
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      unveilCover.style.transition = 'transform 0.3s ease';

      if (currentOffset >= maxOffset * 0.6) {
        // 揭幕完成
        unveilCover.style.transform = `translateY(${maxOffset + 50}px)`;
        unveilCover.style.opacity = '0';
        AudioEngine.playSuccess();

        setTimeout(() => {
          unveilCover.style.display = 'none';
          // 显示分享
          setTimeout(() => {
            phase2.style.display = 'none';
            phase3.style.display = 'flex';
            launchConfetti();
          }, 800);
        }, 300);
      } else {
        // 弹回
        currentOffset = 0;
        unveilCover.style.transform = 'translateY(0)';
      }
    }

    unveilCover.addEventListener('mousedown', onDragStart);
    unveilCover.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('mousemove', (e) => { if (isDragging) onDragMove(e); });
    document.addEventListener('touchmove', (e) => {
      if (isDragging) { e.preventDefault(); onDragMove(e); }
    }, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
  }

  // === 交互3: 分享动画 (CSS Confetti) ===
  function launchConfetti() {
    const colors = ['#ff6b35', '#ffd700', '#1a73e8', '#0d904f', '#d93025', '#f59b00', '#e040fb', '#00bcd4'];
    const frag = document.createDocumentFragment();
    const count = window.H5_UTILS && window.H5_UTILS.isMobile ? 40 : 80;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = -(Math.random() * 20) + 'px';
      piece.style.width = (Math.random() * 10 + 5) + 'px';
      piece.style.height = (Math.random() * 10 + 5) + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      frag.appendChild(piece);
    }

    document.body.appendChild(frag);

    // 清理
    setTimeout(() => {
      document.querySelectorAll('.confetti-piece').forEach(p => p.remove());
    }, 3500);
  }

  // === 分享按钮 ===
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      launchConfetti();
      AudioEngine.playSuccess();
      // 尝试调用系统分享
      if (navigator.share) {
        navigator.share({
          title: '暴雨永川 · 线上应急救援纪实',
          text: '一起学习应急救援，守护家园！',
          url: window.location.href
        }).catch(() => {});
      }
    });
    shareBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      shareBtn.click();
    });
  }
}

document.addEventListener('DOMContentLoaded', initP5);
