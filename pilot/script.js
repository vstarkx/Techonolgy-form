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
    if (btnBack) btnBack.hidden = step <= 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnSave?.addEventListener('click', (e) => {
    if (currentStep === 1) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      showStep(2);
    }
  });

  btnBack?.addEventListener('click', () => { if (currentStep > 1) showStep(currentStep - 1); });

  function bytesToSize(bytes) { const sizes=['B','KB','MB','GB']; if(!bytes) return '0 B'; const i=Math.floor(Math.log(bytes)/Math.log(1024)); return (bytes/Math.pow(1024,i)).toFixed(1)+' '+sizes[i]; }

  function wireDropZone(zoneId, inputId, listId) {
    const dropzone = document.getElementById(zoneId);
    const fileInput = document.getElementById(inputId);
    const fileList = document.getElementById(listId);
    function addFiles(files) {
      Array.from(files).forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <div class="meta">
            <div class="name">${f.name}</div>
            <div class="size">${bytesToSize(f.size)}</div>
          </div>
          <div class="file-actions">
            <span class="icon" title="Open"></span>
            <span class="icon delete" title="Remove"></span>
          </div>
        `;
        item.querySelector('.delete')?.addEventListener('click', () => item.remove());
        fileList?.appendChild(item);
      });
    }
    dropzone?.addEventListener('click', (e) => { if ((e.target).closest && (e.target).closest('[data-action="browse"]')) fileInput?.click(); });
    dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); });
    dropzone?.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer?.files) addFiles(e.dataTransfer.files); });
    fileInput?.addEventListener('change', () => { if (fileInput.files) addFiles(fileInput.files); fileInput.value=''; });
  }

  wireDropZone('pt-dropzone', 'pt-file-input', 'pt-file-list');
  wireDropZone('dropzone', 'file-input', 'file-list');

  showStep(1);
});