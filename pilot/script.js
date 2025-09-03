document.addEventListener('DOMContentLoaded', () => {
  const stepsNav = document.getElementById('stepsNav');
  const form = document.getElementById('pilot-form');
  const btnBack = document.getElementById('btn-back');
  const btnSave = document.getElementById('btn-save');

  const stepEls = Array.from(document.querySelectorAll('.step'));
  let currentStep = 1;

  function showStep(step) {
    currentStep = step;
    stepEls.forEach(el => el.hidden = el.dataset.step !== String(step));
    stepsNav?.setAttribute('active-step', String(step));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnSave?.addEventListener('click', (e) => {
    if (currentStep === 1) {
      e.preventDefault();
      // basic required validation by calling checkValidity
      if (!form.checkValidity()) { form.reportValidity(); return; }
      showStep(2);
    }
  });

  btnBack?.addEventListener('click', () => { if (currentStep > 1) showStep(currentStep - 1); });

  // Attachments simple logic
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');

  function addFiles(files) {
    Array.from(files).forEach(f => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `<div><div class="name">${f.name}</div><div class="size">${(f.size/1024).toFixed(1)} KB</div></div><button type="button" class="btn">Remove</button>`;
      item.querySelector('button')?.addEventListener('click', () => item.remove());
      fileList?.appendChild(item);
    });
  }

  dropzone?.addEventListener('click', (e) => {
    if ((e.target).closest && (e.target).closest('[data-action="browse"]')) fileInput?.click();
  });
  dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); });
  dropzone?.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer?.files) addFiles(e.dataTransfer.files); });
  fileInput?.addEventListener('change', () => { if (fileInput.files) addFiles(fileInput.files); fileInput.value = ''; });

  showStep(1);
});