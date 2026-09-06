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

// --- SECTION 5: FALLING CARDS PHYSICS & SCROLL OBSERVER ---
(function() {
  const tipsData = [
    {
      id: 'tip-card-1',
      key: 'tip_01_dismissed',
      headerText: 'TIP 01 / 03',
      bodyText: 'DAE works best with documents on the same topic — two versions of a contract, two research papers, two policy docs.',
      dropDelay: 800,
      getStartX: () => window.innerWidth - 255
    },
    {
      id: 'tip-card-2',
      key: 'tip_02_dismissed',
      headerText: 'TIP 02 / 03',
      bodyText: 'The terminal demo is simulated. Your real analysis runs on your actual PDFs using local AI embeddings.',
      dropDelay: 1800,
      getStartX: () => window.innerWidth - 245
    },
    {
      id: 'tip-card-3',
      key: 'tip_03_dismissed',
      headerText: 'TIP 03 / 03',
      bodyText: 'Results are downloadable as JSON or TXT. Every analysis is saved to history automatically.',
      dropDelay: 2800,
      getStartX: () => window.innerWidth - 250
    }
  ];

  const activeCards = [];

  tipsData.forEach(data => {
    if (sessionStorage.getItem(data.key) === 'true') {
      return;
    }

    const cardEl = document.createElement('div');
    cardEl.className = 'falling-tip-card';
    cardEl.id = data.id;

    cardEl.innerHTML = `
      <div class="tip-card-header">
        <span>${data.headerText}</span>
        <span class="tip-card-close">✕</span>
      </div>
      <div class="tip-card-body">
        ${data.bodyText}
      </div>
    `;

    document.body.appendChild(cardEl);

    const closeBtn = cardEl.querySelector('.tip-card-close');

    const cardObj = {
      ...data,
      x: data.getStartX(),
      y: window.innerHeight - 340,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0,
      angle: (Math.random() - 0.5) * 4,
      angularVelocity: (Math.random() - 0.5) * 0.1,
      width: 220,
      height: 90,
      isOnGround: false,
      isSettled: false,
      isDropped: false,
      isDismissing: false,
      settleCounter: 0,
      isSquashing: false,
      element: cardEl
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissCard(cardObj);
    });

    cardEl.addEventListener('mouseenter', () => {
      if (cardObj.isSettled && !cardObj.isDismissing) {
        cardObj.vy = -2;
        cardObj.isOnGround = false;
        cardObj.isSettled = false;
        cardObj.settleCounter = 0;
      }
    });

    activeCards.push(cardObj);
  });

  function dismissCard(cardObj) {
    if (cardObj.isDismissing) return;
    cardObj.isDismissing = true;
    cardObj.isSettled = false;
    cardObj.isOnGround = false;
    cardObj.vy = -15;
    cardObj.vx = (Math.random() - 0.5) * 2;
    cardObj.element.style.opacity = '0';
    sessionStorage.setItem(cardObj.key, 'true');
    setTimeout(() => {
      if (cardObj.element.parentNode) {
        cardObj.element.parentNode.removeChild(cardObj.element);
      }
    }, 500);
  }

  function dropCard(cardObj) {
    if (cardObj.isDropped || cardObj.isDismissing) return;
    cardObj.isDropped = true;
    cardObj.y = window.innerHeight - 340;
    cardObj.x = cardObj.getStartX();
    cardObj.vy = 0;
    cardObj.vx = (Math.random() - 0.5) * 0.4;
    cardObj.angularVelocity = (Math.random() - 0.5) * 0.1;
    cardObj.angle = (Math.random() - 0.5) * 4;
  }

  activeCards.forEach(card => {
    setTimeout(() => {
      dropCard(card);
    }, card.dropDelay);
  });

  const scrollContainer = document.getElementById('home-scroll');
  const demoSec = document.getElementById('demo-section');
  const exSec = document.getElementById('examples-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.id === 'demo-section') {
          const c2 = activeCards.find(c => c.id === 'tip-card-2');
          if (c2) dropCard(c2);
        }
        if (entry.target.id === 'examples-section') {
          const c3 = activeCards.find(c => c.id === 'tip-card-3');
          if (c3) dropCard(c3);
        }
      }
    });
  }, { root: scrollContainer, threshold: 0.3 });

  if (demoSec) observer.observe(demoSec);
  if (exSec) observer.observe(exSec);

  const gravity = 0.45;
  const bounceDamping = 0.55;
  const friction = 0.88;
  const angularFriction = 0.90;

  function physicsLoop() {
    const liveCards = activeCards.filter(c => c.isDropped && c.element.parentNode);

    liveCards.forEach(c => {
      if (c.element.offsetHeight) {
        c.height = c.element.offsetHeight;
      }
    });

    liveCards.forEach(c => {
      if (c.isDismissing) {
        c.y += c.vy;
        c.x += c.vx;
        c.element.style.left = c.x + 'px';
        c.element.style.top = c.y + 'px';
        return;
      }

      if (c.isSettled) return;

      c.vy += gravity;

      c.x += c.vx;
      c.y += c.vy;

      c.angularVelocity = Math.max(-0.15, Math.min(0.15, c.angularVelocity));
      c.angle += c.angularVelocity;
      c.angle = Math.max(-8, Math.min(8, c.angle));

      const cardWidth = 220;
      const cardHeight = c.height || 90;
      const yFloor = window.innerHeight - cardHeight - 30;
      const xRight = window.innerWidth - cardWidth - 30;
      const xLeft = window.innerWidth - 260;

      if (c.y >= yFloor) {
        c.y = yFloor;
        c.vy *= -bounceDamping;
        c.vx *= friction;
        c.angularVelocity = Math.max(-0.15, Math.min(0.15, c.vx * 0.2));

        c.isSquashing = true;
        setTimeout(() => { c.isSquashing = false; }, 60);

        if (Math.abs(c.vy) < 1.5) {
          c.isOnGround = true;
        }
        if (Math.abs(c.vy) < 0.8) {
          c.vy = 0;
        }
      }

      if (c.x > xRight) {
        c.x = xRight;
        c.vx *= -0.4;
        c.angularVelocity *= -0.5;
      }

      if (c.x < xLeft) {
        c.x = xLeft;
        c.vx *= -0.4;
        c.angularVelocity *= -0.5;
      }

      if (c.isOnGround) {
        c.vx *= friction;
        c.angularVelocity = Math.max(-0.15, Math.min(0.15, c.vx * 0.15));
        c.angularVelocity *= angularFriction;

        const speed = Math.hypot(c.vx, c.vy);
        if (speed < 0.1) {
          c.settleCounter++;
          if (c.settleCounter >= 60) {
            c.isSettled = true;
            c.angle = (Math.random() - 0.5) * 6;
            c.angularVelocity = 0;
            c.vx = 0;
            c.vy = 0;
          }
        } else {
          c.settleCounter = 0;
        }
      }
    });

    for (let i = 0; i < liveCards.length; i++) {
      for (let j = i + 1; j < liveCards.length; j++) {
        const c1 = liveCards[i];
        const c2 = liveCards[j];

        if (c1.isDismissing || c2.isDismissing) continue;

        const h1 = c1.height || 90;
        const h2 = c2.height || 90;

        const overlapX = Math.min(c1.x + c1.width, c2.x + c2.width) - Math.max(c1.x, c2.x);
        const overlapY = Math.min(c1.y + h1, c2.y + h2) - Math.max(c1.y, c2.y);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            if (c1.x < c2.x) {
              c1.x -= overlapX * 0.5;
              c2.x += overlapX * 0.5;
            } else {
              c1.x += overlapX * 0.5;
              c2.x -= overlapX * 0.5;
            }
            const tmpVx = c1.vx;
            c1.vx = c1.vx * 0.6 + c2.vx * 0.4;
            c2.vx = c2.vx * 0.6 + tmpVx * 0.4;
          } else {
            if (c1.y < c2.y) {
              c1.y -= overlapY * 0.5;
              c2.y += overlapY * 0.5;
            } else {
              c1.y += overlapY * 0.5;
              c2.y -= overlapY * 0.5;
            }
            const tmpVy = c1.vy;
            c1.vy = c1.vy * 0.6 + c2.vy * 0.4;
            c2.vy = c2.vy * 0.6 + tmpVy * 0.4;
          }

          c1.angularVelocity = Math.max(-0.15, Math.min(0.15, c1.angularVelocity + (Math.random() - 0.5) * 0.1));
          c2.angularVelocity = Math.max(-0.15, Math.min(0.15, c2.angularVelocity + (Math.random() - 0.5) * 0.1));

          c1.element.style.borderColor = '#0A0A0A';
          c2.element.style.borderColor = '#0A0A0A';
          setTimeout(() => {
            c1.element.style.borderColor = '#D4CFC4';
            c2.element.style.borderColor = '#D4CFC4';
          }, 80);
        }
      }
    }

    liveCards.forEach(c => {
      if (!c.isDismissing) {
        c.element.style.left = c.x + 'px';
        c.element.style.top = c.y + 'px';

        let transformStr = `rotate(${c.angle}deg)`;
        if (c.isSquashing) {
          transformStr += ` scaleY(0.88) scaleX(1.08)`;
        }
        c.element.style.transform = transformStr;
      }
    });

    requestAnimationFrame(physicsLoop);
  }

  requestAnimationFrame(physicsLoop);
})();
