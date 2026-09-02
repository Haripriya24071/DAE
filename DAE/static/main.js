/* DAE - Data Analyser Engine Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {
  initFileUploads();
  initDiffFilters();
});

function initFileUploads() {
  const fileInputA = document.getElementById('file_a');
  const fileInputB = document.getElementById('file_b');
  const dropzoneA = document.getElementById('dropzone_a');
  const dropzoneB = document.getElementById('dropzone_b');
  const compareForm = document.getElementById('compareForm');
  const compareBtn = document.getElementById('compareBtn');
  const statusMsg = document.getElementById('statusMsg');

  if (!compareForm) return;

  function handleFileSelect(input, dropzone, badgeId) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF document.');
        input.value = '';
        return;
      }
      dropzone.classList.add('has-file');
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.style.display = 'inline-flex';
        badge.innerHTML = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      }
    }
    checkFormReady();
  }

  function checkFormReady() {
    if (fileInputA && fileInputB && compareBtn) {
      const ready = fileInputA.files.length > 0 && fileInputB.files.length > 0;
      compareBtn.disabled = !ready;
    }
  }

  // Setup drag & drop listeners
  [
    { zone: dropzoneA, input: fileInputA, badge: 'badge_a' },
    { zone: dropzoneB, input: fileInputB, badge: 'badge_b' }
  ].forEach(item => {
    if (!item.zone || !item.input) return;

    item.zone.addEventListener('click', () => item.input.click());

    item.input.addEventListener('change', () => {
      handleFileSelect(item.input, item.zone, item.badge);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      item.zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.zone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      item.zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.zone.classList.remove('dragover');
      }, false);
    });

    item.zone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        item.input.files = files;
        handleFileSelect(item.input, item.zone, item.badge);
      }
    });
  });

  // Handle AJAX form submission
  compareForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInputA.files[0] || !fileInputB.files[0]) {
      alert('Please upload both PDF files.');
      return;
    }

    const formData = new FormData();
    formData.append('doc_a', fileInputA.files[0]);
    formData.append('doc_b', fileInputB.files[0]);

    compareBtn.disabled = true;
    compareBtn.innerHTML = `
      <svg class="spin" style="width: 20px; height: 20px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="31.4" stroke-dashoffset="10"></circle>
      </svg>
      Analyzing Documents...
    `;

    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.className = 'status-msg info';
      statusMsg.textContent = 'Extracting PDF text and generating text diff & similarity metrics...';
    }

    try {
      const response = await fetch('/compare', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.error || 'Failed to compare documents');
      }
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = `Error: ${err.message}`;
      }
      compareBtn.disabled = false;
      compareBtn.innerHTML = '⚡ Compare Documents';
    }
  });
}

function initDiffFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const diffRows = document.querySelectorAll('.diff-row');
  const searchInput = document.getElementById('diffSearchInput');

  if (!filterTabs.length || !diffRows.length) return;

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');
      applyFilters(filter, searchInput ? searchInput.value.toLowerCase() : '');
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeTab = document.querySelector('.filter-tab.active');
      const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
      applyFilters(filter, e.target.value.toLowerCase());
    });
  }

  function applyFilters(filterType, searchQuery) {
    diffRows.forEach(row => {
      const rowType = row.getAttribute('data-type');
      const rowText = row.textContent.toLowerCase();

      const typeMatch = filterType === 'all' || rowType === filterType;
      const searchMatch = !searchQuery || rowText.includes(searchQuery);

      if (typeMatch && searchMatch) {
        row.style.display = 'grid';
      } else {
        row.style.display = 'none';
      }
    });
  }
}
