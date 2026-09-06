function confirmClearHistory() {
  if (confirm("Delete all history? This cannot be undone.")) {
    document.getElementById('clear-form').submit();
  }
}

function filterHistory(filterType, btnEl) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  const rows = document.querySelectorAll('.history-data-row');
  rows.forEach(row => {
    const cCnt = parseInt(row.getAttribute('data-contradictions') || '0');
    const aCnt = parseInt(row.getAttribute('data-agreements') || '0');
    const sim = parseFloat(row.getAttribute('data-similarity') || '0');

    if (filterType === 'all') {
      row.style.display = '';
    } else if (filterType === 'high-match') {
      if (sim >= 70 || aCnt > cCnt) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    } else if (filterType === 'contradictions') {
      if (cCnt > 0) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

function copyLink(entryId) {
  const url = window.location.origin + '/share/' + entryId;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('share-' + entryId);
    btn.textContent = '[✓]';
    btn.style.color = '#CC1C1C';
    btn.style.borderColor = '#CC1C1C';
    setTimeout(() => {
      btn.textContent = '[SHARE]';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}
