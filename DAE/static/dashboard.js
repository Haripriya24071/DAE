// State 1: IDLE, State 2: FILES_LOADED, State 3: ANALYSING, State 4: RESULTS
let currentState = 1;
let file1 = null;
let file2 = null;

let multiMode = false;
let multiFiles = {1: null, 2: null, 3: null, 4: null, 5: null};

function setMode(mode) {
  multiMode = mode === 'multi';
  document.getElementById('zones-standard').style.display = multiMode ? 'none' : 'block';
  document.getElementById('zones-multi').style.display = multiMode ? 'block' : 'none';
  document.getElementById('mode-standard').classList.toggle('active', !multiMode);
  document.getElementById('mode-multi').classList.toggle('active', multiMode);
  updateDocsLoadedStat();
  checkReadyState();
}

document.addEventListener('DOMContentLoaded', () => {
  for (let slot = 1; slot <= 5; slot++) {
    const zone = document.getElementById(`multi-zone-${slot}`);
    const fileInput = document.getElementById(`multi-file-${slot}`);
    if (!zone || !fileInput) continue;

    zone.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-file-btn')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) setMultiSlotFile(slot, e.target.files[0]);
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        setMultiSlotFile(slot, e.dataTransfer.files[0]);
      }
    });
  }

  document.querySelectorAll('.multi-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slot = parseInt(btn.getAttribute('data-slot'));
      clearMultiSlot(slot);
    });
  });
});

function isValidFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith('.pdf') || 
         name.endsWith('.docx') || 
         name.endsWith('.txt');
}

function setMultiSlotFile(slotNum, file) {
  if (!isValidFile(file)) {
    showError('Only PDF, DOCX, and TXT files are supported.');
    return;
  }
  multiFiles[slotNum] = file;
  const zone = document.getElementById(`multi-zone-${slotNum}`);
  const emptyView = document.getElementById(`multi-empty-view-${slotNum}`);
  const loadedView = document.getElementById(`multi-loaded-view-${slotNum}`);
  const nameEl = document.getElementById(`multi-filename-${slotNum}`);
  const sizeEl = document.getElementById(`multi-filesize-${slotNum}`);

  if (zone) zone.classList.add('loaded');
  if (emptyView) emptyView.style.display = 'none';
  if (loadedView) loadedView.style.display = 'flex';
  if (nameEl) nameEl.textContent = file.name;
  
  const ext = file.name.split('.').pop().toUpperCase();
  const extColors = {PDF: '#CC1C1C', DOCX: '#0A0A0A', TXT: '#6B6760'};
  if (sizeEl) sizeEl.innerHTML = `<span style="font-family:'Space Mono',monospace; font-size:8px; font-weight:bold; color:${extColors[ext] || '#6B6760'}; margin-right:6px;">${ext}</span>${formatSize(file.size)}`;

  updateDocsLoadedStat();
  checkReadyState();
}

function clearMultiSlot(slotNum) {
  multiFiles[slotNum] = null;
  const input = document.getElementById(`multi-file-${slotNum}`);
  if (input) input.value = '';

  const zone = document.getElementById(`multi-zone-${slotNum}`);
  const emptyView = document.getElementById(`multi-empty-view-${slotNum}`);
  const loadedView = document.getElementById(`multi-loaded-view-${slotNum}`);

  if (zone) zone.classList.remove('loaded');
  if (emptyView) emptyView.style.display = 'flex';
  if (loadedView) loadedView.style.display = 'none';

  updateDocsLoadedStat();
  checkReadyState();
}

function updateDocsLoadedStat() {
  let count = 0;
  if (multiMode) {
    count = Object.values(multiFiles).filter(f => f !== null).length;
  } else {
    count = (file1 ? 1 : 0) + (file2 ? 1 : 0);
  }
  document.getElementById('stat-docs').textContent = count;
}

function checkReadyState() {
  if (multiMode) {
    const loadedCount = Object.values(multiFiles).filter(f => f !== null).length;
    if (loadedCount >= 2) {
      btnRun.disabled = false;
      btnRun.classList.add('enabled');
      hintText.textContent = `COMPARING ${loadedCount} DOCUMENTS (30–90 SEC)`;
      if (currentState === 1) {
        currentState = 2;
        document.getElementById('stat-status').textContent = 'READY';
      }
    } else {
      btnRun.disabled = true;
      btnRun.classList.remove('enabled');
      hintText.textContent = 'SELECT AT LEAST 2 DOCUMENTS';
    }
  } else {
    if (file1 && file2) {
      btnRun.disabled = false;
      btnRun.classList.add('enabled');
      hintText.textContent = 'ESTIMATED TIME: 30–90 SEC';
      if (currentState === 1) {
        currentState = 2;
        document.getElementById('stat-status').textContent = 'READY';
      }
    } else {
      btnRun.disabled = true;
      btnRun.classList.remove('enabled');
      hintText.textContent = 'SELECT BOTH DOCUMENTS';
    }
  }
}

function handleRunAnalysis() {
  if (multiMode) {
    const loadedFiles = Object.values(multiFiles).filter(f => f !== null);
    if (loadedFiles.length < 2) return;
    runMultiAnalysis();
  } else {
    if (!file1 || !file2) return;
    runAnalysis();
  }
}

async function runMultiAnalysis() {
  const formData = new FormData();
  let fileIdx = 1;
  for (let slot = 1; slot <= 5; slot++) {
    if (multiFiles[slot]) {
      formData.append(`doc_${fileIdx}`, multiFiles[slot]);
      fileIdx++;
    }
  }

  currentState = 3;
  document.getElementById('stat-status').textContent = 'ANALYSING';
  btnRun.disabled = true;

  showProgressUI();
  updateProgressLabel('Analyzing multiple documents...');
  updateProgressBar(20);

  try {
    const targetUrl = typeof analyzeMultiUrl !== 'undefined' ? analyzeMultiUrl : '/analyze-multi';
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      showError(data.error || 'Multi-document analysis failed.');
      resetToIdle();
      return;
    }

    updateProgressBar(100);
    updateProgressLabel('Analysis complete. Loading results...');
    analysesRunCount++;
    sessionStorage.setItem('dae_analyses_run', analysesRunCount.toString());
    document.getElementById('stat-runs').textContent = analysesRunCount;
    document.getElementById('stat-status').textContent = 'DONE';
    currentState = 4;

    setTimeout(() => {
      window.location.href = data.redirect_url;
    }, 1500);

  } catch (err) {
    showError('Connection lost during multi-document analysis.');
    resetToIdle();
  }
}

// Session storage analyses count
let analysesRunCount = parseInt(sessionStorage.getItem('dae_analyses_run') || '0');
document.getElementById('stat-runs').textContent = analysesRunCount;

// Canvas setup
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
let width = 0, height = 0;
let mouseX = -1000, mouseY = -1000;

function resizeCanvas() {
  width = canvasContainer.clientWidth;
  height = canvasContainer.clientHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => {
  mouseX = -1000;
  mouseY = -1000;
});

// Upload slots setup
const zone1 = document.getElementById('zone-1');
const zone2 = document.getElementById('zone-2');
const file1Input = document.getElementById('file-1');
const file2Input = document.getElementById('file-2');
const btnRun = document.getElementById('btn-run-analysis');
const hintText = document.getElementById('run-hint-text');

zone1.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-file-btn')) return;
  file1Input.click();
});
zone2.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-file-btn')) return;
  file2Input.click();
});

file1Input.addEventListener('change', (e) => {
  if (e.target.files.length > 0) setSlotFile(1, e.target.files[0]);
});
file2Input.addEventListener('change', (e) => {
  if (e.target.files.length > 0) setSlotFile(2, e.target.files[0]);
});

document.querySelectorAll('.remove-file-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const slot = parseInt(btn.getAttribute('data-slot'));
    clearSlot(slot);
  });
});

[zone1, zone2].forEach((zone, idx) => {
  const slotNum = idx + 1;
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      setSlotFile(slotNum, e.dataTransfer.files[0]);
    }
  });
});

function setSlotFile(slotNum, file) {
  if (!isValidFile(file)) {
    showError('Only PDF, DOCX, and TXT files are supported.');
    return;
  }
  if (slotNum === 1) file1 = file;
  else file2 = file;

  const zone = document.getElementById(`zone-${slotNum}`);
  const emptyView = document.getElementById(`empty-view-${slotNum}`);
  const loadedView = document.getElementById(`loaded-view-${slotNum}`);
  const nameEl = document.getElementById(`filename-${slotNum}`);
  const sizeEl = document.getElementById(`filesize-${slotNum}`);

  zone.classList.add('loaded');
  emptyView.style.display = 'none';
  loadedView.style.display = 'flex';
  nameEl.textContent = file.name;

  const ext = file.name.split('.').pop().toUpperCase();
  const extColors = {PDF: '#CC1C1C', DOCX: '#0A0A0A', TXT: '#6B6760'};
  sizeEl.innerHTML = `<span style="font-family:'Space Mono',monospace; font-size:8px; font-weight:bold; color:${extColors[ext] || '#6B6760'}; margin-right:6px;">${ext}</span>${formatSize(file.size)}`;

  updateDocsLoadedStat();
  checkReadyState();
}

function clearSlot(slotNum) {
  if (slotNum === 1) {
    file1 = null;
    file1Input.value = '';
  } else {
    file2 = null;
    file2Input.value = '';
  }

  const zone = document.getElementById(`zone-${slotNum}`);
  const emptyView = document.getElementById(`empty-view-${slotNum}`);
  const loadedView = document.getElementById(`loaded-view-${slotNum}`);

  zone.classList.remove('loaded');
  emptyView.style.display = 'flex';
  loadedView.style.display = 'none';

  updateDocsLoadedStat();
  if (currentState !== 3) {
    if (!file1 || !file2) {
      currentState = 1;
      document.getElementById('stat-status').textContent = 'IDLE';
    }
  }
  checkReadyState();
}

function resetSlots() {
  clearSlot(1);
  clearSlot(2);
  currentState = 1;
  document.getElementById('stat-status').textContent = 'IDLE';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function toggleSwitch(row) {
  const isCurrentlyOn = row.getAttribute('data-on') === 'true';
  row.setAttribute('data-on', isCurrentlyOn ? 'false' : 'true');
}

// --- STREAMING ANALYSIS ---
let liveContradictions = [];
let liveAgreements = [];
let liveBlindSpotsA = [];
let liveBlindSpotsB = [];

async function runAnalysis() {
  const formData = new FormData();
  formData.append('doc_a', file1);
  formData.append('doc_b', file2);

  liveContradictions = [];
  liveAgreements = [];
  liveBlindSpotsA = [];
  liveBlindSpotsB = [];
  document.getElementById('live-contradictions').textContent = '0';
  document.getElementById('live-agreements').textContent = '0';
  document.getElementById('live-blind_spots').textContent = '0';

  currentState = 3;
  document.getElementById('stat-status').textContent = 'ANALYSING';
  btnRun.disabled = true;
  
  // Show progress UI
  showProgressUI();

  try {
    const targetUrl = typeof analyzeStreamUrl !== 'undefined' ? analyzeStreamUrl : '/analyze-stream';
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errData = {};
      try { errData = await response.json(); } catch(e) {}
      showError(errData.error || errData.message || `Server error (${response.status})`);
      resetToIdle();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      let currentEvent = null;
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            handleStreamEvent(currentEvent, data);
          } catch(e) {}
          currentEvent = null;
        }
      }
    }
  } catch (err) {
    showError('Connection lost during analysis. Please try again.');
    resetToIdle();
  }
}

function handleStreamEvent(event, data) {
  switch(event) {
    case 'progress':
      updateProgressBar(data.percent);
      updateProgressLabel(data.message);
      updateStepIndicator(data.step, data.total);
      break;

    case 'contradiction':
      liveContradictions.push(data.data);
      updateLiveCounter('contradictions', liveContradictions.length);
      const color = data.severity === 'CRITICAL' ? '#CC1C1C'
        : data.severity === 'SIGNIFICANT' ? '#8B6914' : '#6B6760';
      flashCounter('contradictions', color);
      break;

    case 'agreement':
      liveAgreements.push(data.data);
      updateLiveCounter('agreements', liveAgreements.length);
      flashCounter('agreements', '#0A0A0A');
      break;

    case 'blind_spot_a':
      liveBlindSpotsA.push(data.text);
      updateLiveCounter('blind_spots', 
        liveBlindSpotsA.length + liveBlindSpotsB.length);
      break;

    case 'blind_spot_b':
      liveBlindSpotsB.push(data.text);
      updateLiveCounter('blind_spots', 
        liveBlindSpotsA.length + liveBlindSpotsB.length);
      break;

    case 'complete':
      completeAnimation(data);
      analysesRunCount++;
      sessionStorage.setItem('dae_analyses_run', analysesRunCount.toString());
      document.getElementById('stat-runs').textContent = analysesRunCount;
      document.getElementById('stat-status').textContent = 'DONE';
      currentState = 4;
      setTimeout(() => {
        window.location.href = data.redirect_url;
      }, 1800);
      break;

    case 'error':
      showError(data.message);
      resetToIdle();
      break;
  }
}

function showProgressUI() {
  const overlay = document.getElementById('stream-overlay');
  if (overlay) overlay.classList.add('active');
}

function updateLiveCounter(type, value) {
  const el = document.getElementById(`live-${type}`);
  if (el) {
    el.textContent = value;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 300);
  }
}

function flashCounter(type, color) {
  const el = document.getElementById(`live-${type}`);
  if (el) {
    el.style.color = color;
    el.style.transform = 'scale(1.3)';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
    }, 200);
  }
}

function updateProgressBar(percent) {
  const bar = document.getElementById('stream-progress-fill');
  if (bar) bar.style.width = percent + '%';
}

function updateProgressLabel(message) {
  const label = document.getElementById('stream-progress-label');
  if (label) label.textContent = message;
}

function updateStepIndicator(step, total) {
  const el = document.getElementById('stream-step');
  if (el) el.textContent = `STEP ${step} / ${total}`;
}

function completeAnimation(data) {
  const label = document.getElementById('stream-progress-label');
  if (label) label.textContent = 'Analysis complete. Loading results...';
  updateProgressBar(100);
}

function resetToIdle() {
  liveContradictions = [];
  liveAgreements = [];
  liveBlindSpotsA = [];
  liveBlindSpotsB = [];
  const overlay = document.getElementById('stream-overlay');
  if (overlay) overlay.classList.remove('active');
  currentState = file1 && file2 ? 2 : 1;
  document.getElementById('stat-status').textContent = file1 && file2 ? 'READY' : 'IDLE';
  btnRun.disabled = !(file1 && file2);
}

function showError(msg) {
  showErrorBanner(msg);
}

function showErrorBanner(msg) {
  const banner = document.getElementById('error-banner');
  const textEl = document.getElementById('error-banner-text');
  textEl.textContent = msg;
  banner.style.display = 'flex';
  setTimeout(hideErrorBanner, 5000);
}

function hideErrorBanner() {
  document.getElementById('error-banner').style.display = 'none';
}

function exportPNG() {
  const a = document.createElement('a');
  a.download = `dae-analysis-${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// --- CANVAS ANIMATION LOOP (4 STATES) ---
const particles = [];
for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * 800,
    y: Math.random() * 600,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.6 + 0.3,
    color: Math.random() < 0.05 ? '#CC1C1C' : '#D0CBC2',
    size: 1.5,
    group: i % 2 === 0 ? 1 : 2
  });
}

let scanLineY = 0;

function renderCanvas(time) {
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 0, width, height);

  if (currentState === 1) { // IDLE
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#9A9490';
    ctx.font = '13px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DROP TWO DOCUMENTS TO BEGIN', width / 2, height / 2);

  } else if (currentState === 2) { // FILES LOADED
    const f1 = { x: width * 0.3, y: height * 0.5 };
    const f2 = { x: width * 0.7, y: height * 0.5 };

    particles.forEach(p => {
      const target = p.group === 1 ? f1 : f2;
      p.vx += (target.x - p.x) * 0.001;
      p.vy += (target.y - p.y) * 0.001;
      p.vx *= 0.92; p.vy *= 0.92;
      p.x += p.vx; p.y += p.vy;

      ctx.fillStyle = p.color === '#CC1C1C' ? '#CC1C1C' : '#D0CBC2';
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#CC1C1C';
    ctx.font = '13px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('READY TO ANALYSE', width / 2, height / 2);

  } else if (currentState === 3) { // ANALYSING SCAN
    scanLineY += 2;
    if (scanLineY > height) scanLineY = 0;

    ctx.strokeStyle = '#CC1C1C';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, scanLineY);
    ctx.lineTo(width, scanLineY);
    ctx.stroke();

    ctx.fillStyle = '#0A0A0A';
    ctx.font = '12px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CROSS-DOCUMENT VECTOR SEARCH IN PROGRESS...', width / 2, height / 2);

  } else if (currentState === 4) { // RESULTS PREVIEW
    ctx.fillStyle = '#0A0A0A';
    ctx.font = '16px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ANALYSIS COMPLETE — REDIRECTING...', width / 2, height / 2);
  }

  requestAnimationFrame(renderCanvas);
}

requestAnimationFrame(renderCanvas);
