// --- SECTION 1: HERO CANVAS ANIMATION ---
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeH() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth * window.devicePixelRatio;
    canvas.height = 400 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resizeH);
  resizeH();

  const labels = [
    { text: "CONTRADICTION DETECTED", color: "#CC2200" },
    { text: "AGREEMENT FOUND", color: "#1A6B00" },
    { text: "BLIND SPOT", color: "#996600" }
  ];
  let labelIdx = 0;
  let labelAlpha = 0;
  let labelState = 0; // 0: fadeIn, 1: hold, 2: fadeOut
  let labelTimer = performance.now();

  const particles = [];
  for (let i = 0; i < 15; i++) {
    particles.push({
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
      offsetY: (Math.random() - 0.5) * 40
    });
  }

  function renderHeroCanvas(time) {
    const w = canvas.clientWidth;
    const h = 400;
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, w, h);

    const rectW = 120;
    const rectH = 160;
    const rectA = { x: w * 0.2 - rectW / 2, y: h * 0.5 - rectH / 2 };
    const rectB = { x: w * 0.8 - rectW / 2, y: h * 0.5 - rectH / 2 };

    // Connecting lines
    ctx.strokeStyle = '#D4CFC4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rectA.x + rectW, rectA.y + rectH / 2);
    ctx.lineTo(rectB.x, rectB.y + rectH / 2);
    ctx.stroke();

    // Particles along connecting line
    particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;

      const px = (rectA.x + rectW) + p.progress * (rectB.x - (rectA.x + rectW));
      const py = (h * 0.5) + p.offsetY * Math.sin(p.progress * Math.PI);

      ctx.fillStyle = '#1A6B00';
      ctx.fillRect(px, py, 3, 3);
    });

    // Draw Rect A
    drawDocRect(rectA.x, rectA.y, rectW, rectH, "DOC A");
    // Draw Rect B
    drawDocRect(rectB.x, rectB.y, rectW, rectH, "DOC B");

    // Cycle Label Logic
    const now = performance.now();
    const elapsed = now - labelTimer;

    if (labelState === 0) { // Fade in
      labelAlpha = Math.min(1, elapsed / 500);
      if (labelAlpha >= 1) {
        labelState = 1;
        labelTimer = now;
      }
    } else if (labelState === 1) { // Hold 1.5s
      labelAlpha = 1;
      if (elapsed >= 1500) {
        labelState = 2;
        labelTimer = now;
      }
    } else if (labelState === 2) { // Fade out
      labelAlpha = Math.max(0, 1 - elapsed / 500);
      if (labelAlpha <= 0) {
        labelState = 0;
        labelIdx = (labelIdx + 1) % labels.length;
        labelTimer = now;
      }
    }

    // Draw Center Floating Label
    const currentLbl = labels[labelIdx];
    ctx.globalAlpha = labelAlpha;
    ctx.fillStyle = currentLbl.color;
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText(currentLbl.text, w / 2, h / 2 - 15);
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(renderHeroCanvas);
  }

  function drawDocRect(x, y, w, h, label) {
    // Hard shadow
    ctx.fillStyle = '#D4CFC4';
    ctx.fillRect(x + 4, y + 4, w, h);

    // Rect body
    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Label
    ctx.fillStyle = '#0A0A0A';
    ctx.font = '9px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + 24);

    // 6 text simulation lines
    ctx.fillStyle = '#E4E0D5';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(x + 16, y + 44 + i * 16, w - 32, 4);
    }
  }

  requestAnimationFrame(renderHeroCanvas);
})();

// --- SECTION 3: TYPEWRITER & PREVIEW DEMO ---
(function() {
  const lines = [
    "> Loading doc_a: contract_v1.pdf",
    "> Loading doc_b: contract_v2.pdf",
    "> Building vector store A... done (47 chunks)",
    "> Building vector store B... done (52 chunks)",
    "> Running cross-document search...",
    "> Contradiction found at chunk 12",
    "> LLM verdict: DISAGREE",
    "> Reason: Doc A states 30-day notice period, Doc B states 14-day",
    "> Agreement found at chunk 8",
    "> Analysis complete. 3 contradictions, 7 agreements, 2 blind spots."
  ];

  const termEl = document.getElementById('terminal-text');
  const cardContra = document.getElementById('card-contradiction');
  const cardAgree = document.getElementById('card-agreement');
  if (!termEl) return;

  let lineIdx = 0;
  let charIdx = 0;

  function typeNextChar() {
    if (lineIdx >= lines.length) {
      // Pause 3 seconds then restart
      setTimeout(() => {
        termEl.innerHTML = '';
        cardContra.classList.remove('visible');
        cardAgree.classList.remove('visible');
        lineIdx = 0;
        charIdx = 0;
        typeNextChar();
      }, 3000);
      return;
    }

    const currentLine = lines[lineIdx];

    if (charIdx === 0) {
      const div = document.createElement('div');
      div.id = `term-line-${lineIdx}`;
      termEl.appendChild(div);
    }

    const currentDiv = document.getElementById(`term-line-${lineIdx}`);
    currentDiv.textContent = currentLine.slice(0, charIdx + 1);
    charIdx++;

    // Trigger preview cards based on text milestones
    if (currentLine.includes("Contradiction found")) {
      cardContra.classList.add('visible');
    }
    if (currentLine.includes("Agreement found")) {
      cardAgree.classList.add('visible');
    }

    if (charIdx < currentLine.length) {
      setTimeout(typeNextChar, 50);
    } else {
      lineIdx++;
      charIdx = 0;
      setTimeout(typeNextChar, 300);
    }
  }

  typeNextChar();
})();

// --- SECTION 4: CARD EXPAND/COLLAPSE ---
function toggleExpand(card) {
  const shortTexts = card.querySelectorAll('.card-text-short');
  const fullTexts = card.querySelectorAll('.card-text-full');

  shortTexts.forEach(st => {
    st.style.display = st.style.display === 'none' ? 'inline' : 'none';
  });
  fullTexts.forEach(ft => {
    ft.style.display = ft.style.display === 'none' ? 'inline' : 'none';
  });
}
