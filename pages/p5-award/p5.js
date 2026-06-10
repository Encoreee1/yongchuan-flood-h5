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
    submitBtn.addEventListener('touchend', (e) => { e.preventDefault(); handleSubmit(e); });
  }

  // === 交互2: 滑动揭幕 ===
  let unveilDragging = false;
  let unveilStart = 0;
  let unveilOffset = 0;

  function unveilStartDrag(e) {
    unveilDragging = true;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    unveilStart = clientY - unveilOffset;
    unveilCover.style.transition = 'none';
    if (e.cancelable) e.preventDefault();
  }

  function unveilMove(e) {
    if (!unveilDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const container = slide.querySelector('#unveilContainer');
    const maxOffset = container ? container.offsetHeight * 0.85 : 170;
    unveilOffset = Math.max(0, Math.min(maxOffset, clientY - unveilStart));
    unveilCover.style.transform = `translateY(${unveilOffset}px)`;
  }

  function unveilEnd() {
    if (!unveilDragging) return;
    unveilDragging = false;
    unveilCover.style.transition = 'transform 0.3s ease';

    const container = slide.querySelector('#unveilContainer');
    const maxOffset = container ? container.offsetHeight * 0.85 : 170;

    if (unveilOffset >= maxOffset * 0.6) {
      unveilCover.style.transform = `translateY(${maxOffset + 50}px)`;
      unveilCover.style.opacity = '0';
      AudioEngine.playSuccess();
      setTimeout(() => {
        unveilCover.style.display = 'none';
        setTimeout(() => {
          phase2.style.display = 'none';
          phase3.style.display = 'flex';
          launchConfetti();
        }, 800);
      }, 300);
    } else {
      unveilOffset = 0;
      unveilCover.style.transform = 'translateY(0)';
    }
  }

  if (unveilCover) {
    unveilCover.addEventListener('mousedown', unveilStartDrag);
    unveilCover.addEventListener('touchstart', unveilStartDrag, { passive: false });
  }

  // 全局 move/end（仅揭幕状态时生效）
  document.addEventListener('mousemove', unveilMove);
  document.addEventListener('mouseup', unveilEnd);
  document.addEventListener('touchmove', (e) => { if (unveilDragging) unveilMove(e); }, { passive: false });
  document.addEventListener('touchend', unveilEnd);
  document.addEventListener('touchcancel', unveilEnd);

  // === 交互3: 分享动画 (CSS Confetti) ===
  function launchConfetti() {
    const colors = ['#ff6b35', '#ffd700', '#1a73e8', '#0d904f', '#d93025', '#f59b00', '#e040fb', '#00bcd4'];
    const frag = document.createDocumentFragment();
    const count = window.H5_UTILS && window.H5_UTILS.isMobile ? 40 : 80;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = -(Math.random() * 20 + 5) + 'px';
      piece.style.width = (Math.random() * 10 + 5) + 'px';
      piece.style.height = (Math.random() * 10 + 5) + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      frag.appendChild(piece);
    }
    document.body.appendChild(frag);
    setTimeout(() => {
      document.querySelectorAll('.confetti-piece').forEach(p => p.remove());
    }, 3500);
  }

  // === 分享按钮 ===
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      launchConfetti();
      AudioEngine.playSuccess();
      if (navigator.share) {
        navigator.share({
          title: '暴雨永川 · 线上应急救援纪实',
          text: '一起学习应急救援，守护家园！',
          url: window.location.href
        }).catch(() => {});
      }
    });
    shareBtn.addEventListener('touchend', (e) => { e.preventDefault(); shareBtn.click(); });
  }
}

document.addEventListener('DOMContentLoaded', initP5);
