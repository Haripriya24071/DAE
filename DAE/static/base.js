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
      const isDark = document.documentElement.classList.contains('dark');
      cCtx.fillStyle = isDark ? 'rgba(204, 255, 0, ' + d.alpha + ')' : 'rgba(125, 168, 0, ' + d.alpha + ')';
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

// --- SILK AURORA FLOWING BACKGROUND ENGINE ---
(function() {
  const canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = 0;
  let height = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / width - 0.5) * 2;
    targetMouseY = (e.clientY / height - 0.5) * 2;
  });

  let time = 0;

  function drawSilkAurora() {
    time += 0.003;
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background gradient fill
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      bgGrad.addColorStop(0, '#000000');
      bgGrad.addColorStop(0.5, '#050705');
      bgGrad.addColorStop(1, '#000000');
    } else {
      bgGrad.addColorStop(0, '#F5F4EF');
      bgGrad.addColorStop(0.5, '#EDEBE4');
      bgGrad.addColorStop(1, '#E5E3DC');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Aurora Ribbons Setup
    const numRibbons = 6;
    const wavePoints = 40;

    for (let r = 0; r < numRibbons; r++) {
      ctx.beginPath();
      
      const speedOffset = time * (0.6 + r * 0.2);
      const yBase = height * (0.1 + r * 0.15) + mouseY * 45;
      const alphaMult = isDark ? (0.7 + r * 0.08) : (0.2 + r * 0.04);

      // Ribbon gradient
      const ribbonGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        if (r % 3 === 0) {
          ribbonGrad.addColorStop(0, `rgba(204, 255, 0, ${0.45 * alphaMult})`);
          ribbonGrad.addColorStop(0.5, `rgba(0, 230, 118, ${0.55 * alphaMult})`);
          ribbonGrad.addColorStop(1, `rgba(166, 255, 0, ${0.2 * alphaMult})`);
        } else if (r % 3 === 1) {
          ribbonGrad.addColorStop(0, `rgba(166, 255, 0, ${0.5 * alphaMult})`);
          ribbonGrad.addColorStop(0.5, `rgba(0, 200, 83, ${0.4 * alphaMult})`);
          ribbonGrad.addColorStop(1, `rgba(204, 255, 0, ${0.25 * alphaMult})`);
        } else {
          ribbonGrad.addColorStop(0, `rgba(0, 230, 118, ${0.35 * alphaMult})`);
          ribbonGrad.addColorStop(0.6, `rgba(204, 255, 0, ${0.5 * alphaMult})`);
          ribbonGrad.addColorStop(1, `rgba(0, 180, 136, ${0.2 * alphaMult})`);
        }
      } else {
        ribbonGrad.addColorStop(0, `rgba(125, 168, 0, ${0.2 * alphaMult})`);
        ribbonGrad.addColorStop(0.5, `rgba(76, 175, 80, ${0.18 * alphaMult})`);
        ribbonGrad.addColorStop(1, `rgba(139, 195, 74, ${0.1 * alphaMult})`);
      }

      ctx.fillStyle = ribbonGrad;

      // Draw Wave Curve
      ctx.moveTo(-50, height + 100);
      for (let i = 0; i <= wavePoints; i++) {
        const x = (width / wavePoints) * i;
        const wave1 = Math.sin(i * 0.18 + speedOffset + mouseX * 0.4) * 50;
        const wave2 = Math.cos(i * 0.12 - speedOffset * 0.7) * 40;
        const wave3 = Math.sin((i + r) * 0.25 + speedOffset * 1.1) * 25;
        const y = yBase + wave1 + wave2 + wave3;

        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = (width / wavePoints) * (i - 1);
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, y, cpX, y);
        }
      }

      ctx.lineTo(width + 50, height + 100);
      ctx.closePath();
      ctx.fill();
    }

    requestAnimationFrame(drawSilkAurora);
  }

  requestAnimationFrame(drawSilkAurora);
})();
