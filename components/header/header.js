const template = document.createElement('template');

template.innerHTML = `
<style>
  :host { display: block; }
  .header { box-sizing: border-box; display: flex; flex-direction: row; align-items: center; padding: 0; width: 100%; height: 80px; background: #FFFFFF; border-bottom: 1px solid #D9D9D9; }
  .left { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 0 20px; gap: 10px; width: 251px; height: 80px; border-right: 1px solid #D9D9D9; }
  .logo { width: 89.63px; height: 40px; object-fit: contain; }
  .right { flex: 1 1 auto; align-self: stretch; display: flex; }
  .bar { display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 0 30px; gap: 24px; width: 100%; }
  .title { width: auto; height: 20px; font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 500; font-size: 16px; line-height: 20px; color: #292929; }
  /* Steps */
  .steps { margin: 0; padding: 0; }
  .steps ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: row; align-items: center; gap: 24px; }
  .step { display: flex; align-items: center; gap: 10px; color: #6B7280; white-space: nowrap; }
  .step .num { width: 28px; height: 28px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #D9D9D9; background: #fff; font-weight: 600; color: #6B7280; font-size: 12px; }
  .step.active { color: #292929; }
  .step.active .num { border-color: #D97706; color: #D97706; }
  @media (max-width: 900px) {
    .title { display: none; }
    .bar { padding: 0 16px; }
  }
</style>
<header class="header">
  <div class="left">
    <img class="logo" src="components/header/logo.svg" alt="PIF Logo" />
  </div>
  <div class="right">
    <div class="bar">
      <div class="title"></div>
      <nav class="steps">
        <ol>
          <li class="step active"><span class="num">1</span><span class="label">Enter information</span></li>
          <li class="step"><span class="num">2</span><span class="label">Associated challenges</span></li>
          <li class="step"><span class="num">3</span><span class="label">Upload resources</span></li>
        </ol>
      </nav>
    </div>
  </div>
</header>
`;

class PifHeader extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.appendChild(template.content.cloneNode(true));
      const title = this.getAttribute('title') || '';
      root.querySelector('.title').textContent = title;
    }
  }
}

customElements.define('pif-header', PifHeader);