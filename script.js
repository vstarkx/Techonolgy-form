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

  // Remove explicit Save navigation; rely on submit handler
  if (btnSave) {
    btnSave.addEventListener('click', () => { /* submit handler will handle step transitions */ });
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
