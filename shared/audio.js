/* ============================================
   audio.js — Web Audio API 音效引擎
   无需外部音频文件，实时合成哨声/警报等音效
   ============================================ */

const AudioEngine = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 某些浏览器需要 resume
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  // === 哨声音效 ===
  function playWhistle(duration = 0.8) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, c.currentTime + duration * 0.3);
    osc.frequency.linearRampToValueAtTime(1400, c.currentTime + duration * 0.6);
    osc.frequency.setValueAtTime(1400, c.currentTime + duration);

    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  // === 警报音效 ===
  function playAlert(duration = 1.0) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, c.currentTime);

    // 交替频率模拟警报
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const t = c.currentTime + (duration / steps) * i;
      const freq = i % 2 === 0 ? 800 : 500;
      osc.frequency.linearRampToValueAtTime(freq, t);
    }

    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  // === 成功音效 ===
  function playSuccess() {
    const c = getCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // === 错误/震动音效 ===
  function playError() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.linearRampToValueAtTime(80, c.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.25);
  }

  // === 点击/拾取音效 ===
  function playClick() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  }

  // === 初始化（处理浏览器自动播放限制）===
  function init() {
    const c = getCtx();
    if (c.state === 'suspended') {
      c.resume();
    }
  }

  return { playWhistle, playAlert, playSuccess, playError, playClick, init };
})();

// 首次用户交互时初始化音频
document.addEventListener('touchstart', () => AudioEngine.init(), { once: true });
document.addEventListener('mousedown', () => AudioEngine.init(), { once: true });
