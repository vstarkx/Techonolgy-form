// Web components: header and steps
(function(){
  const headerT = document.createElement('template');
  headerT.innerHTML = `
<style>
  :host { display: block; }
  .header { box-sizing: border-box; display: flex; flex-direction: row; align-items: center; padding: 0; width: 100%; height: 80px; background: var(--surface); border-bottom: 1px solid var(--border); }
  .left { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 0 20px; gap: 10px; width: 251px; height: 80px; border-right: 1px solid var(--border); }
  .logo { width: 89.63px; height: 40px; object-fit: contain; background: var(--text); mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/></svg>') center/contain no-repeat; }
  .right { flex: 1 1 auto; align-self: stretch; display: flex; }
  .bar { display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 0 30px; gap: 24px; width: 100%; }
  .title { width: auto; height: 20px; font-weight: 500; font-size: 16px; line-height: 20px; color: var(--text); }
  .theme-toggle { appearance: none; border-radius: 8px; padding: 8px 12px; font-size: 14px; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text); }
  .theme-toggle:hover { background: rgba(0,0,0,0.04); }
  @media (max-width: 900px) { .bar { padding: 0 16px; } }
</style>
<header class="header">
  <div class="left">
    <div class="logo" aria-hidden="true"></div>
  </div>
  <div class="right">
    <div class="bar">
      <div class="title"></div>
      <button class="theme-toggle" type="button" aria-label="Toggle theme"></button>
    </div>
  </div>
</header>`;

  class PifHeader extends HTMLElement {
    connectedCallback() {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(headerT.content.cloneNode(true));
        const title = this.getAttribute('title') || '';
        root.querySelector('.title').textContent = title;
        const button = root.querySelector('.theme-toggle');
        const getStoredTheme = () => { try { return localStorage.getItem('theme'); } catch(e) { return null; } };
        const setStoredTheme = (mode) => { try { localStorage.setItem('theme', mode); } catch(e) {} };
        const applyTheme = (mode) => {
          const html = document.documentElement;
          html.setAttribute('data-theme', mode);
          button.textContent = mode === 'dark' ? 'Light mode' : 'Dark mode';
        };
        const initial = getStoredTheme() || 'light';
        applyTheme(initial);
        button.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
          const next = current === 'dark' ? 'light' : 'dark';
          applyTheme(next);
          setStoredTheme(next);
        });
      }
    }
  }
  customElements.define('pif-header', PifHeader);
})();

(function(){
  const stepsT = document.createElement('template');
  stepsT.innerHTML = `
<style>
  :host { display: block; }
  .sidebar { display: flex; flex-direction: column; align-items: flex-start; padding: 20px; width: 210.5px; background: var(--sidebar-bg); border-right: 1px solid var(--border); min-height: calc(100vh - 80px); height:100%; }
  .stack { display: flex; flex-direction: column; align-items: flex-start; padding: 0; gap: 20px; width: 100%; }
  .item { display: flex; flex-direction: row; align-items: center; padding: 0 6px; gap: 10px; height: 50px; border-radius: 3px; width:100% }
  .icon { position: relative; isolation: isolate; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 50.6502px; background: transparent; }
  .num { font-weight: 300; font-size: 16px; line-height: 20px; color: var(--sidebar-text); display: flex; align-items: center; justify-content: center; width: 16px; }
  .label { font-weight: 500; font-size: 14px; line-height: 17px; color: var(--sidebar-text); }
  .active { background: var(--sidebar-active-bg); border-left: 3px solid var(--step-n-background); }
  .active .icon { border-color: var(--step-n-border); background: var(--step-n-background); }
  .active .num { color: var(--step-n-color); }
  .active .label { color: #fff; }
  .completed .icon { background: var(--text); border-color: var(--text); }
  .completed .num { visibility: hidden; }
  .completed .icon::after { content: ""; position: absolute; z-index: 1; width: 10px; height: 6px; border-left: 2px solid #FFFFFF; border-bottom: 2px solid #FFFFFF; transform: rotate(-45deg); top: 12px; left: 11px; }
  .completed .label { color: var(--sidebar-text); }
  @media (max-width: 960px) { .sidebar { display: none; } }
</style>
<aside class="sidebar" role="navigation" aria-label="Steps">
  <div class="stack"></div>
</aside>`;

  class StepsSidebar extends HTMLElement {
    static get observedAttributes() { return ['active-step', 'labels']; }
    connectedCallback() {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(stepsT.content.cloneNode(true));
      }
      this.render();
    }
    attributeChangedCallback() { this.render(); }
    render() {
      const root = this.shadowRoot; if (!root) return;
      const container = root.querySelector('.stack'); container.innerHTML = '';
      const labelsAttr = this.getAttribute('labels');
      const labels = labelsAttr ? labelsAttr.split('|') : ['Enter information','Associated challenges','Upload resources'];
      const active = parseInt(this.getAttribute('active-step') || '1', 10);
      labels.forEach((label, index) => {
        const stepIndex = index + 1;
        let stateClass = '';
        if (stepIndex < active) stateClass = ' completed';
        else if (stepIndex === active) stateClass = ' active';
        const item = document.createElement('div');
        item.className = 'item' + stateClass;
        item.innerHTML = `<div class="icon"><span class="num">${stepIndex}</span></div><div class="label">${label}</div>`;
        container.appendChild(item);
      });
    }
  }
  customElements.define('steps-sidebar', StepsSidebar);
})();

// App logic for both modes
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const mode = app?.getAttribute('data-mode') === 'pilot' ? 'pilot' : 'tech';
  const stepsNav = document.getElementById('stepsNav');
  const stepEls = Array.from(document.querySelectorAll('.step'));
  let currentStep = 1;

  if (stepsNav) {
    stepsNav.setAttribute('labels', mode === 'pilot' ? 'Pilot information|Attachments' : 'Enter information|Associated challenges|Upload resources');
  }

  const form = document.getElementById(mode === 'pilot' ? 'pilot-form' : 'tech-form');
  const btnBack = document.getElementById(mode === 'pilot' ? 'btn-back-pilot' : 'btn-back-tech');
  const btnCancel = document.getElementById(mode === 'pilot' ? 'btn-cancel-pilot' : 'btn-cancel-tech');
  const btnSave = document.getElementById(mode === 'pilot' ? 'btn-save-pilot' : 'btn-save-tech');

  function showStep(step) {
    currentStep = step;
    stepEls.forEach(el => el.hidden = el.dataset.step !== String(step));
    if (stepsNav) stepsNav.setAttribute('active-step', String(step));
    if (btnBack) btnBack.hidden = step <= 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Multiselect init
  document.querySelectorAll('.multiselect').forEach(initMultiselect);

  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      if (mode === 'pilot') {
        if (currentStep === 1) {
          e.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          showStep(2);
        }
      } else {
        if (currentStep === 2) {
          e.preventDefault();
          showStep(3);
        } else if (currentStep === 3) {
          e.preventDefault();
          console.log('Step 3 save clicked');
        }
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => { if (currentStep > 1) showStep(currentStep - 1); });
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

  // Submit for tech form moves to step 2
  if (form && form.id === 'tech-form') {
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
  }

  // Dropzones
  function wireDropZone(zoneId, inputId, listId) {
    const dropzone = document.getElementById(zoneId);
    const fileInput = document.getElementById(inputId);
    const fileList = document.getElementById(listId);
    function bytesToSize(bytes) {
      const sizes = ['B','KB','MB','GB'];
      if (!bytes) return '0 B';
      const i = Math.floor(Math.log(bytes)/Math.log(1024));
      return (bytes/Math.pow(1024,i)).toFixed(1)+' '+sizes[i];
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
            <span class="icon" title="Open"></span>
            <span class="icon delete" title="Remove"></span>
          </div>`;
        item.querySelector('.delete')?.addEventListener('click', () => item.remove());
        fileList?.appendChild(item);
      });
    }
    dropzone?.addEventListener('click', (e) => { const t = e.target; if (t && t.closest && t.closest('[data-action="browse"]')) fileInput?.click(); });
    dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
    dropzone?.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('drag'); if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files); });
    fileInput?.addEventListener('change', () => { if (fileInput.files?.length) addFiles(fileInput.files); fileInput.value=''; });
  }

  wireDropZone('dropzone', 'file-input', 'file-list');
  wireDropZone('pt-dropzone', 'pt-file-input', 'pt-file-list');

  showStep(1);
});

// Multiselect
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
    optionEl.addEventListener('click', () => { if (state.has(opt)) state.delete(opt); else state.add(opt); render(); });
    menuEl.appendChild(optionEl);
  });

  toggleEl.addEventListener('click', () => { const open = container.classList.toggle('open'); toggleEl.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', (e) => { if (!container.contains(e.target)) { container.classList.remove('open'); toggleEl.setAttribute('aria-expanded', 'false'); } });

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
        chip.querySelector('.chip-remove').addEventListener('click', () => { state.delete(label); render(); });
        valuesEl.appendChild(chip);
        const hidden = document.createElement('input');
        hidden.type = 'hidden'; hidden.name = hiddenName; hidden.value = label; container.appendChild(hidden);
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
  if (preselected) { preselected.split('|').forEach(v => state.add(v)); }
  else { ['AI & ML', 'Big Data & Analytics'].forEach(v => { if (options.includes(v)) state.add(v); }); }
  render();
}

function resetMultiselect(container) { if (container && typeof container.__reset === 'function') container.__reset(); }

