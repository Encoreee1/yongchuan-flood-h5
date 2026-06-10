/* ============================================
   p4.js — 核心救援游戏交互
   交互1: 长按哨子 (2秒) → 求救信号 + 哨声
   交互2: 拖拽路障碎片到对应位置 (拼图+拖拽合并)
   交互3: 顺序点击 安抚→包扎→转移
   ============================================ */

function initP4() {
  const slide = document.querySelector('.p4-slide');
  if (!slide) return;

  // Steps
  const step1 = slide.querySelector('#p4Step1');
  const step2 = slide.querySelector('#p4Step2');
  const step4 = slide.querySelector('#p4Step4');
  const complete = slide.querySelector('#p4Complete');
  const stepDots = slide.querySelectorAll('.step-dot');

  function goToStep(n) {
    [step1, step2, step4].forEach(s => { if (s) s.style.display = 'none'; });
    stepDots.forEach(d => { d.classList.remove('active'); d.classList.add('done'); });

    if (n === 1) { step1.style.display = 'flex'; stepDots[0].classList.add('active'); stepDots[0].classList.remove('done'); }
    if (n === 2) { step2.style.display = 'flex'; stepDots[1].classList.add('active'); }
    if (n === 3) { step4.style.display = 'flex'; stepDots[2].classList.add('active'); }
  }

  // === 交互1: 长按哨子 ===
  const whistleBtn = slide.querySelector('#whistleBtn');
  const step1Hint = slide.querySelector('#step1Hint');

  if (whistleBtn) {
    let pressTimer = null;
    let isPressing = false;

    function startPress(e) {
      e.preventDefault();
      isPressing = true;
      whistleBtn.classList.add('pressing');
      step1Hint.textContent = '坚持住...';
      AudioEngine.playClick();

      pressTimer = setTimeout(() => {
        if (isPressing) {
          // 长按成功！
          whistleBtn.classList.remove('pressing');
          whistleBtn.style.background = 'var(--c-success)';
          whistleBtn.innerHTML = '✓<br><small>求救信号已发出</small>';
          step1Hint.textContent = '哨声响起！求救信号已发出';
          AudioEngine.playWhistle(1.2);
          stepDots[0].classList.remove('active');
          stepDots[0].classList.add('done');

          setTimeout(() => goToStep(2), 600);
        }
      }, 2000);
    }

    function endPress(e) {
      isPressing = false;
      whistleBtn.classList.remove('pressing');
      clearTimeout(pressTimer);
      if (whistleBtn.style.background !== 'var(--c-success)') {
        step1Hint.textContent = '需要长按 2 秒，再试一次！';
      }
    }

    whistleBtn.addEventListener('mousedown', startPress);
    whistleBtn.addEventListener('mouseup', endPress);
    whistleBtn.addEventListener('mouseleave', endPress);
    whistleBtn.addEventListener('touchstart', startPress, { passive: false });
    whistleBtn.addEventListener('touchend', endPress);
    whistleBtn.addEventListener('touchcancel', endPress);
  }

  // === 交互2: 拖拽拼图 ===
  const step2Hint = slide.querySelector('#step2Hint');
  let placedCount = 0;

  const pieces = slide.querySelectorAll('.puzzle-piece');
  const slots = slide.querySelectorAll('.puzzle-slot');

  pieces.forEach(piece => {
    piece.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', piece.id);
      piece.style.opacity = '0.5';
    });
    piece.addEventListener('dragend', () => {
      piece.style.opacity = '';
    });

    // Touch drag support
    let isDragging = false;
    let clone = null;
    let startX, startY, origLeft, origTop;

    piece.addEventListener('touchstart', function(e) {
      if (piece.classList.contains('placed')) return;
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      const rect = piece.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      clone = piece.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = origLeft + 'px';
      clone.style.top = origTop + 'px';
      clone.style.zIndex = '100';
      clone.style.pointerEvents = 'none';
      clone.style.opacity = '0.8';
      clone.style.transform = 'scale(1.1)';
      document.body.appendChild(clone);

      piece.style.opacity = '0.3';
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
      if (!isDragging || !clone) return;
      const touch = e.touches[0];
      clone.style.left = (touch.clientX - 40) + 'px';
      clone.style.top = (touch.clientY - 40) + 'px';
    });

    document.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;

      if (clone) {
        const cx = clone.getBoundingClientRect().left + 40;
        const cy = clone.getBoundingClientRect().top + 40;
        document.body.removeChild(clone);
        clone = null;

        // 检测是否放在正确的 slot 上
        const targetSlot = Array.from(slots).find(slot => {
          const sr = slot.getBoundingClientRect();
          return cx > sr.left && cx < sr.right && cy > sr.top && cy < sr.bottom;
        });

        if (targetSlot && targetSlot.dataset.accept === piece.dataset.target) {
          placePiece(piece, targetSlot);
        } else {
          piece.style.opacity = '';
        }
      }
    });

    piece.addEventListener('mousedown', function(e) {
      if (piece.classList.contains('placed')) return;
      isDragging = true;
      const rect = piece.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      clone = piece.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = origLeft + 'px';
      clone.style.top = origTop + 'px';
      clone.style.zIndex = '100';
      clone.style.pointerEvents = 'none';
      clone.style.opacity = '0.8';
      clone.style.transform = 'scale(1.1)';
      document.body.appendChild(clone);
      piece.style.opacity = '0.3';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging || !clone) return;
      clone.style.left = (e.clientX - 40) + 'px';
      clone.style.top = (e.clientY - 40) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
      if (!isDragging) return;
      isDragging = false;
      if (clone) {
        const cx = e.clientX;
        const cy = e.clientY;
        document.body.removeChild(clone);
        clone = null;

        const targetSlot = Array.from(slots).find(slot => {
          const sr = slot.getBoundingClientRect();
          return cx > sr.left && cx < sr.right && cy > sr.top && cy < sr.bottom;
        });

        if (targetSlot && targetSlot.dataset.accept === piece.dataset.target) {
          placePiece(piece, targetSlot);
        } else {
          piece.style.opacity = '';
        }
      }
    });
  });

  // 也支持 slots 的 drop 事件（原生拖拽）
  slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => { e.preventDefault(); });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const pieceId = e.dataTransfer.getData('text/plain');
      const piece = document.getElementById(pieceId);
      if (piece && slot.dataset.accept === piece.dataset.target) {
        placePiece(piece, slot);
      }
    });
  });

  function placePiece(piece, slot) {
    piece.classList.add('placed');
    slot.classList.add('filled');
    slot.textContent = '✓';
    placedCount++;
    step2Hint.textContent = `已清理 ${placedCount}/3 个路障`;
    AudioEngine.playClick();

    if (placedCount >= 3) {
      AudioEngine.playSuccess();
      stepDots[1].classList.remove('active');
      stepDots[1].classList.add('done');
      setTimeout(() => goToStep(3), 600);
    }
  }

  // === 交互3: 顺序点击 ===
  const orderButtons = slide.querySelectorAll('.order-btn');
  const step3Hint = slide.querySelector('#step3Hint');
  let currentOrder = 0;

  orderButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('correct')) return;
      const expected = currentOrder + 1;
      const pressed = parseInt(btn.dataset.order);

      if (pressed === expected) {
        btn.classList.add('correct');
        btn.textContent = btn.textContent.replace(/^[🤗🩹🚑]/, '✓');
        currentOrder++;
        AudioEngine.playClick();

        if (currentOrder === 1) step3Hint.textContent = '正确！接下来：包扎 → 转移';
        if (currentOrder === 2) step3Hint.textContent = '正确！最后一步：转移';

        if (currentOrder >= 3) {
          // 全部正确！
          AudioEngine.playSuccess();
          stepDots[2].classList.remove('active');
          stepDots[2].classList.add('done');
          step4.style.display = 'none';
          complete.style.display = 'flex';
          // 自动播放急救物资动画
          setTimeout(() => {
            complete.querySelector('p:last-child').textContent = '🩹 绷带 · 💧 饮用水 · 🍞 食物 — 已送达';
          }, 500);
        }
      } else {
        btn.classList.add('wrong');
        AudioEngine.playError();
        step3Hint.textContent = '顺序不对！请按 安抚 → 包扎 → 转移';
        setTimeout(() => btn.classList.remove('wrong'), 400);
      }
    });

    // Touch
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.click();
    });
  });

  // === 页面激活重置 ===
  slide.addEventListener('pageActivated', () => {
    // 不重置，保留进度，用户翻回来可继续
  });
}

document.addEventListener('DOMContentLoaded', initP4);
