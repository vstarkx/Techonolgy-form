const stepsTemplate = document.createElement('template');

stepsTemplate.innerHTML = `
<style>
  :host { display: block; }
  .sidebar {
    display: flex; flex-direction: column; align-items: flex-start; padding: 20px;
    width: 210.5px; background: #FFFFFF; border-right: 1px solid #D9D9D9;
    min-height: calc(100vh - 80px);
    height:100%;
  }
  .stack { display: flex; flex-direction: column; align-items: flex-start; padding: 0; gap: 20px; width: 100%; }
  .item { display: flex; flex-direction: row; align-items: center; padding: 0; gap: 10px; height: 34px; }
  .icon { position: relative; isolation: isolate; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #B8B8B8; border-radius: 50.6502px; background: transparent; }
  .num { font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 300; font-size: 16px; line-height: 20px; color: #B8B8B8; display: flex; align-items: center; justify-content: center; width: 16px; }
  .label { font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 500; font-size: 14px; line-height: 17px; color: #B8B8B8; }

  /* Active state (current) */
  .active .icon { border-color: #BC6322; }
  .active .num { color: #BC6322; }
  .active .label { color: #BC6322; }

  /* Completed state (filled dark circle with white check) */
  .completed .icon { background: #292929; border-color: #292929; }
  .completed .num { visibility: hidden; }
  .completed .icon::after {
    content: ""; position: absolute; z-index: 1; width: 10px; height: 6px; border-left: 2px solid #FFFFFF; border-bottom: 2px solid #FFFFFF; transform: rotate(-45deg); top: 12px; left: 11px;
  }
  .completed .label { color: #292929; }

  /* Upcoming (default grey) already covered by base styles */

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
      let stateClass = '';
      if (stepIndex < active) stateClass = ' completed';
      else if (stepIndex === active) stateClass = ' active';

      const item = document.createElement('div');
      item.className = 'item' + stateClass;
      item.innerHTML = `
        <div class="icon"><span class="num">${stepIndex}</span></div>
        <div class="label">${label}</div>
      `;
      container.appendChild(item);
    });
  }
}

customElements.define('steps-sidebar', StepsSidebar);
