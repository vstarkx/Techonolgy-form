document.addEventListener('DOMContentLoaded', () => {
  // Initialize custom multiselect(s)
  document.querySelectorAll('.multiselect').forEach(initMultiselect);

  const stepsNav = document.getElementById('stepsNav');
  const form = document.getElementById('tech-form');
  const btnCancel = document.getElementById('btn-cancel');
  const btnBack = document.getElementById('btn-back');
  const btnSave = document.getElementById('btn-save');

  const stepEls = Array.from(document.querySelectorAll('.step'));
  let currentStep = 1;

  function showStep(step) {
    currentStep = step;
    stepEls.forEach(el => el.hidden = el.dataset.step !== String(step));
    if (stepsNav) stepsNav.setAttribute('active-step', String(step));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Save & Continue behavior:
  // - On step 1: allow form submit (handled below)
  // - On step 2: prevent submit and go to step 3
  // - On step 3: keep on step 3 (could finalize later)
  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      if (currentStep === 2) {
        e.preventDefault();
        showStep(3);
      } else if (currentStep === 3) {
        e.preventDefault();
        // Keep on step 3 or implement final submit here
        console.log('Step 3 save clicked');
      }
      // If currentStep === 1, we let the submit handler run
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (confirm('Discard changes and exit?')) {
        form?.reset();
        document.querySelectorAll('.multiselect').forEach(ms => resetMultiselect(ms));
        showStep(1);
      }
    });
  }

  // On submit: go to step 2, then return to step 1 after 1s
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    for (const [key] of data.entries()) {
      if (key.endsWith('[]')) {
        payload[key.replace('[]', '')] = data.getAll(key);
        delete payload[key];
      }
    }

    console.log('Submitted', payload);

    showStep(2);
    setTimeout(() => {
      showStep(1);
    }, 1000);
  });

  // Step 3: Drag/drop uploads
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');

  function bytesToSize(bytes) {
    const sizes = ['B','KB','MB','GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  }

  function addFiles(files) {
    Array.from(files).forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <div class="meta">
          <div class="name">${file.name}</div>
          <div class="size">${bytesToSize(file.size)}</div>
        </div>
        <div class="file-actions">
          <span class="icon"></span>
          <span class="icon delete" title="Remove"></span>
        </div>
      `;
      item.querySelector('.delete').addEventListener('click', () => item.remove());
      fileList?.appendChild(item);
    });
  }

  if (dropzone && fileInput && fileList) {
    dropzone.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.closest('[data-action="browse"]')) {
        fileInput.click();
      }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) addFiles(fileInput.files);
      fileInput.value = '';
    });
  }

  showStep(1);
});

function initMultiselect(container) {
  const valuesEl = container.querySelector('.multiselect-values');
  const menuEl = container.querySelector('.multiselect-menu');
  const toggleEl = container.querySelector('.multiselect-toggle');
  const hiddenName = container.dataset.name || 'values[]';
  const options = JSON.parse(container.dataset.options || '[]');

  const state = new Set();

  menuEl.innerHTML = '';
  options.forEach(opt => {
    const optionEl = document.createElement('div');
    optionEl.className = 'multiselect-option';
    optionEl.setAttribute('role', 'option');
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.textContent = opt;
    optionEl.addEventListener('click', () => {
      if (state.has(opt)) state.delete(opt); else state.add(opt);
      render();
    });
    menuEl.appendChild(optionEl);
  });

  toggleEl.addEventListener('click', () => {
    const open = container.classList.toggle('open');
    toggleEl.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
      toggleEl.setAttribute('aria-expanded', 'false');
    }
  });

  function render() {
    valuesEl.innerHTML = '';
    container.querySelectorAll('input[type="hidden"]').forEach(el => el.remove());

    container.querySelectorAll('.multiselect-option').forEach(el => {
      const label = el.textContent || '';
      const selected = state.has(label);
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (selected) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${label}<span class="chip-remove" aria-label="Remove ${label}"></span>`;
        chip.querySelector('.chip-remove').addEventListener('click', () => {
          state.delete(label);
          render();
        });
        valuesEl.appendChild(chip);

        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = hiddenName;
        hidden.value = label;
        container.appendChild(hidden);
      }
    });
  }

  function resetToDefaults() {
    state.clear();
    const preselected = container.getAttribute('data-selected');
    if (preselected) preselected.split('|').forEach(v => state.add(v));
    render();
  }

  container.__reset = resetToDefaults;

  const preselected = container.getAttribute('data-selected');
  if (preselected) {
    preselected.split('|').forEach(v => state.add(v));
  } else {
    ['AI & ML', 'Big Data & Analytics'].forEach(v => { if (options.includes(v)) state.add(v); });
  }
  render();
}

function resetMultiselect(container) {
  if (container && typeof container.__reset === 'function') {
    container.__reset();
  }
}
