document.addEventListener('DOMContentLoaded', () => {
  // Toggle chips selection
  document.querySelectorAll('.chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
  });

  // Buttons
  const btnCancel = document.getElementById('btn-cancel');
  const btnBack = document.getElementById('btn-back');
  const form = document.getElementById('tech-form');

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      // In a real app, navigate away or reset the form
      if (confirm('Discard changes and exit?')) {
        form.reset();
        // Simulate navigation
        console.log('Cancelled.');
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      // Simulate going to previous step
      console.log('Back to previous step');
      alert('Back to previous step');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Collect a simple payload
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    // Collect selected chips
    const selectedTypes = Array.from(document.querySelectorAll('.chips .chip.selected')).map(c => c.textContent.trim());
    payload.technologyTypes = selectedTypes;

    console.log('Saving...', payload);
    alert('Saved! Proceeding to next step.');
  });
});
