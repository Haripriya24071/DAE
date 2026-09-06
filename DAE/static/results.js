// TAB SWITCHING
function switchTab(tabId, btnEl) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  btnEl.classList.add('active');
  clearTraceLine();
}

// NARRATIVE TOGGLE
function toggleNarrativeBody(btn) {
  const container = document.getElementById('narrative-container');
  if (!container) return;
  if (container.style.display === 'none') {
    container.style.display = 'flex';
    btn.textContent = '[COLLAPSE ▲]';
  } else {
    container.style.display = 'none';
    btn.textContent = '[EXPAND ▼]';
  }
}

// --- TOKEN ATTENTION HEATMAP COMPONENT ---
const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for",
  "of","with","by","from","is","are","was","were","be","been",
  "has","have","had","will","would","could","should","may","might",
  "this","that","these","those","it","its","as","not","no","so"
]);

function normalizeWord(w) {
  return w.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function renderHeatmapTokens(text, side, cardIndex, otherText) {
  const wordsSelf = text.split(/\s+/);
  const wordsOther = otherText.split(/\s+/);

  const otherNormalizedSet = new Set(
    wordsOther.map(w => normalizeWord(w)).filter(w => w.length > 0)
  );

  let html = '';

  wordsSelf.forEach((w, idx) => {
    if (!w) return;
    const norm = normalizeWord(w);
    let category = "cold";

    if (norm.length > 0) {
      const isStopword = STOPWORDS.has(norm);
      const isShared = otherNormalizedSet.has(norm);

      if (isShared && !isStopword) {
        category = "hot";
      } else if (!isShared && !isStopword && norm.length > 4) {
        category = "warm";
      } else if (isShared && isStopword) {
        category = "cool";
      }
    }

    html += `<span class="token-span ${category}" data-word="${norm}" data-side="${side}" data-card="${cardIndex}">${w}</span> `;
  });

  return html;
}

// INITIALIZE HEATMAPS & SIMILARITY INTENSITY BARS
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.res-item-card');

  cards.forEach(card => {
    const textA = card.getAttribute('data-chunk-a') || '';
    const textB = card.getAttribute('data-chunk-b') || '';
    const scoreVal = parseFloat(card.getAttribute('data-score') || '0.5');
    const cardIdx = card.getAttribute('data-card-index') || 'card';

    // Render Heatmaps into target elements
    const targetA = card.querySelector('.col-a-target');
    const targetB = card.querySelector('.col-b-target');

    if (targetA) targetA.innerHTML = renderHeatmapTokens(textA, 'a', cardIdx, textB);
    if (targetB) targetB.innerHTML = renderHeatmapTokens(textB, 'b', cardIdx, textA);

    // Similarity Intensity Bar
    const barFill = card.querySelector('.card-sim-bar-fill');
    if (barFill) {
      let pctWidth = 30;
      let barColor = '#0A0A0A';
      if (scoreVal < 0.3) {
        pctWidth = 90;
        barColor = '#CC1C1C';
      } else if (scoreVal <= 0.5) {
        pctWidth = 60;
        barColor = '#8B6914';
      }
      barFill.style.backgroundColor = barColor;
      setTimeout(() => {
        barFill.style.width = pctWidth + '%';
      }, 100);
    }

    // Micro Stats
    const wordsA = textA.split(/\s+/).filter(w => w.length > 0);
    const wordsB = textB.split(/\s+/).filter(w => w.length > 0);
    const setA = new Set(wordsA.map(w => normalizeWord(w)).filter(w => w.length > 0 && !STOPWORDS.has(w)));
    const setB = new Set(wordsB.map(w => normalizeWord(w)).filter(w => w.length > 0 && !STOPWORDS.has(w)));

    let sharedCount = 0;
    setA.forEach(w => { if (setB.has(w)) sharedCount++; });

    const statAEl = card.querySelector('.stat-doc-a-text');
    const statBEl = card.querySelector('.stat-doc-b-text');
    const statSharedEl = card.querySelector('.stat-shared-text');

    if (statAEl) statAEl.textContent = `DOC A: ${wordsA.length} words, ${setA.size} unique`;
    if (statBEl) statBEl.textContent = `DOC B: ${wordsB.length} words, ${setB.size} unique`;
    if (statSharedEl) statSharedEl.textContent = `${sharedCount} shared terms`;
  });

  setupHoverTooltips();
  setupTraceLineClicks();
});

// HOVER TOOLTIP SYSTEM
function setupHoverTooltips() {
  const tooltip = document.getElementById('token-tooltip');

  document.addEventListener('mouseover', (e) => {
    const span = e.target.closest('.token-span');
    if (!span) {
      tooltip.style.display = 'none';
      return;
    }

    if (span.classList.contains('hot')) {
      tooltip.textContent = "SHARED TERM — appears in both documents";
      tooltip.style.boxShadow = "2px 2px 0px #CC1C1C";
      positionTooltip(span);
    } else if (span.classList.contains('warm')) {
      tooltip.textContent = "UNIQUE TO THIS DOCUMENT";
      tooltip.style.boxShadow = "2px 2px 0px #0A0A0A";
      positionTooltip(span);
    } else {
      tooltip.style.display = 'none';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.token-span')) {
      tooltip.style.display = 'none';
    }
  });

  function positionTooltip(span) {
    const rect = span.getBoundingClientRect();
    tooltip.style.display = 'block';
    const ttRect = tooltip.getBoundingClientRect();

    tooltip.style.left = (rect.left + rect.width / 2 - ttRect.width / 2) + 'px';
    tooltip.style.top = (rect.top - ttRect.height - 6) + 'px';
  }
}

// TRACE LINE FEATURE (SVG)
function setupTraceLineClicks() {
  document.addEventListener('click', (e) => {
    const hotSpan = e.target.closest('.token-span.hot');

    if (!hotSpan) {
      clearTraceLine();
      return;
    }

    const side = hotSpan.getAttribute('data-side');
    const word = hotSpan.getAttribute('data-word');
    const cardIdx = hotSpan.getAttribute('data-card');

    if (side !== 'a') {
      clearTraceLine();
      return;
    }

    // Find matching span in side B of same card
    const targetB = document.querySelector(`.token-span.hot[data-word="${word}"][data-side="b"][data-card="${cardIdx}"]`);
    if (!targetB) return;

    drawTraceLine(hotSpan, targetB);
  });
}

function drawTraceLine(spanA, spanB) {
  const svg = document.getElementById('trace-svg');
  svg.innerHTML = '';

  const rectA = spanA.getBoundingClientRect();
  const rectB = spanB.getBoundingClientRect();

  const x1 = rectA.right;
  const y1 = rectA.top + rectA.height / 2;
  const x2 = rectB.left;
  const y2 = rectB.top + rectB.height / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLen = Math.sqrt(dx * dx + dy * dy);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#CC1C1C');
  line.setAttribute('stroke-width', '1.5');
  line.setAttribute('stroke-dasharray', '4 3');
  line.setAttribute('opacity', '0.7');
  line.setAttribute('stroke-dashoffset', lineLen);

  svg.appendChild(line);

  // Animate line draw in
  let start = null;
  function animLine(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const offset = Math.max(0, lineLen * (1 - progress / 400));
    line.setAttribute('stroke-dashoffset', offset);

    if (progress < 400) {
      requestAnimationFrame(animLine);
    } else {
      line.setAttribute('stroke-dashoffset', '0');
    }
  }
  requestAnimationFrame(animLine);
}

function clearTraceLine() {
  const svg = document.getElementById('trace-svg');
  if (svg) svg.innerHTML = '';
}

// SIMILARITY METER ANIMATION (RIGHT PANEL)
(function() {
  const meterFill = document.getElementById('meter-fill');
  const scoreText = document.getElementById('meter-score-text');
  if (!meterFill || !scoreText) return;

  const targetPct = parseInt(meterFill.getAttribute('data-pct') || '43');
  let color = '#CC1C1C';
  if (targetPct > 70) color = '#0A0A0A';
  else if (targetPct >= 40) color = '#8B6914';

  meterFill.style.backgroundColor = color;
  scoreText.style.color = color;

  let start = null;
  function animateMeter(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const pct = Math.min(targetPct, Math.floor((progress / 800) * targetPct));
    
    meterFill.style.width = pct + '%';
    scoreText.textContent = pct + '%';

    if (progress < 800) {
      requestAnimationFrame(animateMeter);
    } else {
      meterFill.style.width = targetPct + '%';
      scoreText.textContent = targetPct + '%';
    }
  }

  requestAnimationFrame(animateMeter);
})();

// --- Q&A CHAT INTERFACE ---

function askSuggestion(btn) {
  document.getElementById('qa-input').value = btn.textContent.trim();
  submitQuestion();
}

async function submitQuestion() {
  const input = document.getElementById('qa-input');
  const question = input.value.trim();
  if (!question) return;

  input.value = '';
  addMessage('user', question);

  const loadingId = addMessage('assistant', 'Thinking...', true);
  const sendBtn = document.querySelector('.qa-send');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const currentEntryId = typeof entryId !== 'undefined' ? entryId : '';
    const response = await fetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, entry_id: currentEntryId })
    });
    const data = await response.json();
    
    removeMessage(loadingId);
    
    if (data.error) {
      addMessage('assistant', 'Error: ' + data.error);
    } else {
      addMessage('assistant', data.answer);
    }
  } catch(e) {
    removeMessage(loadingId);
    addMessage('assistant', 'Connection error. Please try again.');
  }

  if (sendBtn) sendBtn.disabled = false;
  input.focus();
}

function addMessage(role, text, isLoading=false) {
  const id = 'msg-' + Date.now();
  const messages = document.getElementById('qa-messages');
  
  const suggestion = messages.querySelector('.qa-suggestion-row');
  if (suggestion) suggestion.style.display = 'none';

  const div = document.createElement('div');
  div.className = `qa-message ${role}${isLoading ? ' loading' : ''}`;
  div.id = id;
  div.innerHTML = `
    <div class="qa-bubble">${text.replace(/\n/g, '<br>')}</div>
    <div class="qa-meta">${role === 'user' ? 'YOU' : 'DAE'} · ${new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'})}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return id;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// COLOR CONFIDENCE BARS ON LOAD
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.confidence-bar-fill').forEach(bar => {
    const val = parseFloat(bar.dataset.confidence);
    if (val >= 80) bar.style.background = '#0A0A0A';
    else if (val >= 60) bar.style.background = '#8B6914';
    else bar.style.background = '#CC1C1C';
  });
});

function copyShareLink() {
  const currentEntryId = typeof entryId !== 'undefined' ? entryId : '';
  let shareUrl;
  
  if (currentEntryId) {
      shareUrl = window.location.origin + '/share/' + currentEntryId;
  } else {
      shareUrl = window.location.href;
  }
  
  navigator.clipboard.writeText(shareUrl).then(() => {
      const btn = document.getElementById('share-btn');
      btn.textContent = '[COPIED ✓]';
      btn.classList.add('copied');
      setTimeout(() => {
          btn.textContent = '[SHARE ↗]';
          btn.classList.remove('copied');
      }, 2000);
  }).catch(() => {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      const btn = document.getElementById('share-btn');
      btn.textContent = '[COPIED ✓]';
      btn.classList.add('copied');
      setTimeout(() => {
          btn.textContent = '[SHARE ↗]';
          btn.classList.remove('copied');
      }, 2000);
  });
}
