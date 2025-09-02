document.addEventListener('DOMContentLoaded', () => {
  // Initialize custom multiselect(s)
  document.querySelectorAll('.multiselect').forEach(initMultiselect);

  // Buttons
  const btnCancel = document.getElementById('btn-cancel');
  const btnBack = document.getElementById('btn-back');
  const form = document.getElementById('tech-form');

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (confirm('Discard changes and exit?')) {
        form.reset();
        document.querySelectorAll('.multiselect').forEach(ms => resetMultiselect(ms));
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      alert('Back to previous step');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    // Multi-value fields with [] become arrays
    for (const [key] of data.entries()) {
      if (key.endsWith('[]')) {
        payload[key.replace('[]', '')] = data.getAll(key);
        delete payload[key];
      }
    }

    console.log('Saving...', payload);
    alert('Saved! Proceeding to next step.');
  });
});

function initMultiselect(container) {
  const valuesEl = container.querySelector('.multiselect-values');
  const menuEl = container.querySelector('.multiselect-menu');
  const toggleEl = container.querySelector('.multiselect-toggle');
  const hiddenName = container.dataset.name || 'values[]';
  const options = JSON.parse(container.dataset.options || '[]');

  const state = new Set();

  // Render options list
  menuEl.innerHTML = '';
  options.forEach(opt => {
    const optionEl = document.createElement('div');
    optionEl.className = 'multiselect-option';
    optionEl.setAttribute('role', 'option');
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.textContent = opt;
    optionEl.addEventListener('click', () => {
      if (state.has(opt)) {
        state.delete(opt);
      } else {
        state.add(opt);
      }
      render();
    });
    menuEl.appendChild(optionEl);
  });

  // Toggle open/close
  toggleEl.addEventListener('click', () => {
    const open = container.classList.toggle('open');
    toggleEl.setAttribute('aria-expanded', String(open));
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
      toggleEl.setAttribute('aria-expanded', 'false');
    }
  });

  function render() {
    // Update selected chips
    valuesEl.innerHTML = '';

    // Remove prior hidden inputs
    container.querySelectorAll('input[type="hidden"]').forEach(el => el.remove());

    // Update option selection states and add hidden inputs
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
    render();
  }

  // expose reset
  container.__reset = resetToDefaults;

  // Preselect from any data-selected attribute or initial chips (optional)
  const preselected = container.getAttribute('data-selected');
  if (preselected) {
    preselected.split('|').forEach(v => state.add(v));
  } else {
    // Default example selection
    ['AI & ML', 'Big Data & Analytics'].forEach(v => { if (options.includes(v)) state.add(v); });
  }
  render();
}

function resetMultiselect(container) {
  if (container && typeof container.__reset === 'function') {
    container.__reset();
  }
}
