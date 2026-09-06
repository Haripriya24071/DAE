// Theme Toggle Logic
function updateCircleTheme(isDark) {
  const circles = document.querySelectorAll('.dae-circle');
  circles.forEach(c => {
    c.style.transition = 'border-color 0.4s, box-shadow 0.4s';
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('dae-theme', isDark ? 'dark' : 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = isDark ? '○' : '◐';
  updateCircleTheme(isDark);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('dae-theme');
  const icon = document.getElementById('theme-icon');
  if (saved === 'dark' && icon) {
    icon.textContent = '○';
  }
});

// Live Clock
function updateNavClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const clockEl = document.getElementById('nav-clock');
  if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateNavClock, 1000);
updateNavClock();

// Auto-hide Flash Messages after 4s
setTimeout(() => {
  const flashes = document.querySelectorAll('.flash-msg');
  flashes.forEach(f => {
    f.style.transition = 'opacity 0.5s';
    f.style.opacity = '0';
    setTimeout(() => f.remove(), 500);
  });
}, 4000);

// Subtle Cursor Trail Effect
(function() {
  const cCanvas = document.getElementById('cursor-canvas');
  if (!cCanvas) return;
  const cCtx = cCanvas.getContext('2d');
  let dots = [];

  function resizeC() {
    cCanvas.width = window.innerWidth;
    cCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeC);
  resizeC();

  window.addEventListener('mousemove', (e) => {
    dots.push({ x: e.clientX, y: e.clientY, alpha: 0.15, size: 2 });
    if (dots.length > 25) dots.shift();
  });

  function renderTrail() {
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      cCtx.fillStyle = 'rgba(10, 10, 10, ' + d.alpha + ')';
      cCtx.beginPath();
      cCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      cCtx.fill();
      d.alpha *= 0.92;
    }
    dots = dots.filter(d => d.alpha > 0.01);
    requestAnimationFrame(renderTrail);
  }
  requestAnimationFrame(renderTrail);
})();
