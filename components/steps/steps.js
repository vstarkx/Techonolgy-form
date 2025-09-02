const stepsTemplate = document.createElement('template');

stepsTemplate.innerHTML = `
<style>
  :host { display: block; }
  .sidebar {
    /* Frame 2078546411 */
    display: flex; flex-direction: column; align-items: flex-start; padding: 20px;
    width: 250px; background: #FFFFFF; border-right: 1px solid #D9D9D9;
    min-height: calc(100vh - 80px); /* below 80px header */
  }
  .stack { display: flex; flex-direction: column; align-items: flex-start; padding: 0; gap: 20px; width: 100%; }
  .item { display: flex; flex-direction: row; align-items: center; padding: 0; gap: 10px; height: 34px; }
  .icon { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 34px; height: 34px; border: 1px solid #B8B8B8; border-radius: 50.6502px; }
  .num { font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 300; font-size: 16px; line-height: 20px; color: #B8B8B8; display: flex; align-items: center; justify-content: center; width: 16px; }
  .label { font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 500; font-size: 14px; line-height: 17px; color: #B8B8B8; }
  .active .icon { border-color: #BC6322; }
  .active .num { color: #BC6322; }
  .active .label { color: #BC6322; }
  @media (max-width: 960px) { .sidebar { display: none; } }
</style>
<aside class="sidebar" role="navigation" aria-label="Steps">
  <div class="stack"></div>
</aside>
`;

class StepsSidebar extends HTMLElement {
  static get observedAttributes() { return ['active-step', 'labels']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.appendChild(stepsTemplate.content.cloneNode(true));
    }
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  render() {
    const root = this.shadowRoot;
    if (!root) return;
    const container = root.querySelector('.stack');
    container.innerHTML = '';

    const labelsAttr = this.getAttribute('labels');
    const labels = labelsAttr ? labelsAttr.split('|') : [
      'Enter information',
      'Associated challenges',
      'Upload resources'
    ];
    const active = parseInt(this.getAttribute('active-step') || '1', 10);

    labels.forEach((label, index) => {
      const stepIndex = index + 1;
      const item = document.createElement('div');
      item.className = 'item' + (stepIndex === active ? ' active' : '');
      item.innerHTML = `
        <div class="icon"><span class="num">${stepIndex}</span></div>
        <div class="label">${label}</div>
      `;
      container.appendChild(item);
    });
  }
}

customElements.define('steps-sidebar', StepsSidebar);