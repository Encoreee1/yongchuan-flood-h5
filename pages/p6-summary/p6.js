/* ============================================
   p6.js — 科普总结逻辑
   知识卡片、QR 码弹窗
   ============================================ */

function initP6() {
  const slide = document.querySelector('.p6-slide');
  if (!slide) return;

  // === QR 码弹窗 ===
  const qrBtn = document.getElementById('p6QrBtn');
  const qrModal = document.getElementById('qrModal');
  const qrModalBg = document.getElementById('qrModalBg');
  const qrClose = document.getElementById('qrClose');
  const qrCodeEl = document.getElementById('qrCode');
  const qrUrlEl = document.getElementById('qrUrl');

  if (qrBtn && qrModal && qrCodeEl) {
    let qrGenerated = false;

    function openQrModal() {
      qrModal.style.display = 'flex';

      if (!qrGenerated) {
        const url = window.location.href;
        if (qrUrlEl) {
          qrUrlEl.textContent = url;
        }

        // 使用 qrcode.js 生成 QR 码（3×3 大方格风格通过 width/height 控制）
        qrCodeEl.innerHTML = '';
        new QRCode(qrCodeEl, {
          text: url,
          width: 180,
          height: 180,
          colorDark: '#1a1a2e',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });

        qrGenerated = true;
      }
    }

    function closeQrModal() {
      qrModal.style.display = 'none';
    }

    qrBtn.addEventListener('click', openQrModal);
    qrBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      openQrModal();
    });

    if (qrClose) {
      qrClose.addEventListener('click', closeQrModal);
      qrClose.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeQrModal();
      });
    }

    if (qrModalBg) {
      qrModalBg.addEventListener('click', closeQrModal);
    }
  }
}

document.addEventListener('DOMContentLoaded', initP6);
