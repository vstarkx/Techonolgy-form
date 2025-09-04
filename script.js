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
          <span class=""><svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_47608_110089)">
<path d="M17.3154 0.598633V7.11621L17.3447 7.14453L19.1494 8.91797L11.8027 16.1377L9.39062 17.2158L8.34961 16.1924L9.44531 13.8252L16.4248 6.96777L16.4541 6.93945V1.44336H6.61133V6.29883H1.66992V19.2119H16.4541V13.9893L17.3174 13.1436V20.0576H0.808594V5.7002L6 0.598633H17.3154ZM9.88281 14.9297L9.3291 16.1279L9.21875 16.3662L9.45801 16.2588L10.6738 15.7148L10.8047 15.6562L10.7031 15.5547L10.041 14.9004L9.94141 14.8018L9.88281 14.9297ZM15.3555 9.21582L10.4854 14L10.4141 14.0703L10.4844 14.1396L11.4805 15.125L11.5498 15.1934L11.6191 15.125L16.4932 10.335L16.5645 10.2646L16.4932 10.1943L15.4932 9.21582L15.4238 9.14844L15.3555 9.21582ZM16.7275 7.86719L16.1055 8.47852L16.0332 8.54883L16.1055 8.61914L17.1055 9.59766L17.1738 9.66504L17.2432 9.59766L17.8633 8.98828L17.9346 8.91895L17.8633 8.84863L16.8652 7.86719L16.7959 7.7998L16.7275 7.86719ZM5.58105 2.20703L2.44922 5.28711L2.27832 5.45508H5.74805V2.04199L5.58105 2.20703Z" fill="#BC6322" stroke="#BC6322" stroke-width="0.196556"/>
</g>
<defs>
<clipPath id="clip0_47608_110089">
<rect width="20" height="19.6556" fill="white" transform="translate(0 0.5)"/>
</clipPath>
</defs>
</svg>
</span>
          <span class=" delete" title="Remove"><svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_47608_110112)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.73633 4.44922H18.6541L17.1368 20.2917H3.25366L1.73633 4.44922ZM3.14704 5.73127L4.41879 19.0097H15.9716L17.2434 5.73127H3.14704Z" fill="#BC6322"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.37933 0.808594H14.0121L15.409 5.05311L14.1912 5.45388L13.0843 2.09065H7.30709L6.20022 5.45389L4.98242 5.0531L6.37933 0.808594Z" fill="#BC6322"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M10.8377 9.28125V15.456H9.55566V9.28125H10.8377Z" fill="#BC6322"/>
</g>
<defs>
<clipPath id="clip0_47608_110112">
<rect width="20" height="20" fill="white" transform="translate(0 0.5)"/>
</clipPath>
</defs>
</svg>
</span>
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
