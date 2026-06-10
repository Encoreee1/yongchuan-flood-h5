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
  const step3El = slide.querySelector('#p4Step4'); // p4Step4 in HTML
  const complete = slide.querySelector('#p4Complete');
  const stepDots = slide.querySelectorAll('.step-dot');

  function goToStep(n) {
    [step1, step2, step3El].forEach(s => { if (s) s.style.display = 'none'; });
    stepDots.forEach(d => { d.classList.remove('active'); d.classList.add('done'); });

    if (n === 1) { step1.style.display = 'flex'; stepDots[0].classList.add('active'); stepDots[0].classList.remove('done'); }
    if (n === 2) { step2.style.display = 'flex'; stepDots[1].classList.add('active'); }
    if (n === 3) { step3El.style.display = 'flex'; stepDots[2].classList.add('active'); }
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

  // === 交互2: 拖拽拼图（统一全局监听器） ===
  const step2Hint = slide.querySelector('#step2Hint');
  let placedCount = 0;
  let activeDrag = { isDragging: false, piece: null, clone: null };

  const pieces = slide.querySelectorAll('.puzzle-piece');
  const slots = slide.querySelectorAll('.puzzle-slot');

  function getEventPos(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(piece, e) {
    if (piece.classList.contains('placed')) return;
    activeDrag.isDragging = true;
    activeDrag.piece = piece;
    piece.style.opacity = '0.3';

    const clone = piece.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '100';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.85';
    clone.style.transform = 'scale(1.1)';
    const pos = getEventPos(e);
    clone.style.left = (pos.x - 40) + 'px';
    clone.style.top = (pos.y - 40) + 'px';
    document.body.appendChild(clone);
    activeDrag.clone = clone;

    if (e.cancelable) e.preventDefault();
  }

  function moveDrag(e) {
    if (!activeDrag.isDragging || !activeDrag.clone) return;
    const pos = getEventPos(e);
    activeDrag.clone.style.left = (pos.x - 40) + 'px';
    activeDrag.clone.style.top = (pos.y - 40) + 'px';
  }

  function endDrag(e) {
    if (!activeDrag.isDragging) return;
    activeDrag.isDragging = false;

    if (activeDrag.clone) {
      const rect = activeDrag.clone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      document.body.removeChild(activeDrag.clone);
      activeDrag.clone = null;

      const targetSlot = Array.from(slots).find(slot => {
        const sr = slot.getBoundingClientRect();
        return cx > sr.left && cx < sr.right && cy > sr.top && cy < sr.bottom;
      });

      if (targetSlot && activeDrag.piece && targetSlot.dataset.accept === activeDrag.piece.dataset.target) {
        placePiece(activeDrag.piece, targetSlot);
      } else if (activeDrag.piece) {
        activeDrag.piece.style.opacity = '';
      }
      activeDrag.piece = null;
    }
  }

  // 每个碎片绑定 touchstart / mousedown（只在碎片上触发）
  pieces.forEach(piece => {
    piece.addEventListener('touchstart', (e) => { startDrag(piece, e); }, { passive: false });
    piece.addEventListener('mousedown', (e) => { startDrag(piece, e); });
    // 原生 HTML5 drag（桌面端备选）
    piece.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', piece.id);
      piece.style.opacity = '0.5';
    });
    piece.addEventListener('dragend', () => { piece.style.opacity = ''; });
  });

  // 全局只注册一次 move/end 监听器，通过 activeDrag 判断是否在处理拖拽
  document.addEventListener('touchmove', (e) => { if (activeDrag.isDragging) moveDrag(e); }, { passive: false });
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);
  document.addEventListener('mousemove', (e) => { if (activeDrag.isDragging) moveDrag(e); });
  document.addEventListener('mouseup', endDrag);

  // slot 原生 drop
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
        btn.textContent = btn.textContent.replace(/^[^\s]+/, '✓');
        currentOrder++;
        AudioEngine.playClick();

        if (currentOrder === 1) step3Hint.textContent = '正确！接下来：包扎 → 转移';
        else if (currentOrder === 2) step3Hint.textContent = '正确！最后一步：转移';

        if (currentOrder >= 3) {
          AudioEngine.playSuccess();
          stepDots[2].classList.remove('active');
          stepDots[2].classList.add('done');
          step3El.style.display = 'none';
          complete.style.display = 'flex';
          setTimeout(() => {
            const lastP = complete.querySelector('p:last-child');
            if (lastP) lastP.textContent = '🩹 绷带 · 💧 饮用水 · 🍞 食物 — 已送达';
          }, 500);
        }
      } else {
        btn.classList.add('wrong');
        AudioEngine.playError();
        step3Hint.textContent = '顺序不对！请按 安抚 → 包扎 → 转移';
        setTimeout(() => btn.classList.remove('wrong'), 400);
      }
    });

    btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.click(); });
  });

  // 页面激活
  slide.addEventListener('pageActivated', () => {});
}

document.addEventListener('DOMContentLoaded', initP4);
