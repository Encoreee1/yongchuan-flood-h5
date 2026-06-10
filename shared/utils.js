/* ============================================
   utils.js — 工具函数
   rem 适配、设备检测、通用帮助函数
   ============================================ */

// === 设备检测 ===
const isMobile = window.innerWidth < 768;
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// === rem 动态适配 ===
(function setRem() {
  const maxWidth = 750;
  const baseWidth = 375;
  const baseSize = 16;

  function calcRem() {
    const w = Math.min(window.innerWidth, maxWidth);
    const scale = w / baseWidth;
    document.documentElement.style.fontSize = (baseSize * scale) + 'px';
  }

  calcRem();
  window.addEventListener('resize', calcRem);
  window.addEventListener('orientationchange', () => setTimeout(calcRem, 100));
})();

// === 设备信息导出 ===
window.H5_UTILS = {
  isMobile: window.innerWidth < 768,
  isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,

  // 判断是否微信浏览器
  isWechat: /MicroMessenger/i.test(navigator.userAgent),

  // 获取设备类型: 'mobile' | 'desktop'
  getDeviceType() {
    return this.isMobile ? 'mobile' : 'desktop';
  },

  // 重新检测（resize 后调用）
  refresh() {
    this.isMobile = window.innerWidth < 768;
  }
};

// === 通用事件绑定（自动区分 touch/mouse）===
function bindPress(el, callback) {
  if (window.H5_UTILS.isMobile) {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      callback(e);
    });
  } else {
    el.addEventListener('mousedown', callback);
  }
}

function bindRelease(el, callback) {
  if (window.H5_UTILS.isMobile) {
    el.addEventListener('touchend', callback);
    el.addEventListener('touchcancel', callback);
  } else {
    el.addEventListener('mouseup', callback);
    el.addEventListener('mouseleave', callback);
  }
}

function bindLongPress(el, callback, duration = 2000) {
  let timer = null;
  let triggered = false;

  function start(e) {
    triggered = false;
    timer = setTimeout(() => {
      triggered = true;
      callback(e);
    }, duration);
  }

  function end(e) {
    clearTimeout(timer);
    if (!triggered) {
      // 短按，可用于其他逻辑
    }
  }

  if (window.H5_UTILS.isMobile) {
    el.addEventListener('touchstart', start);
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
  } else {
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  return {
    cancel() {
      clearTimeout(timer);
    }
  };
}

// === 生成随机 ID ===
function uid() {
  return 'el_' + Math.random().toString(36).slice(2, 10);
}
