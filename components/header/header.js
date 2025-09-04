const template = document.createElement('template');

template.innerHTML = `
<style>
  :host { display: block; }
  .header { box-sizing: border-box; display: flex; flex-direction: row; align-items: center; padding: 0; width: 100%; height: 80px; background: var(--surface); border-bottom: 1px solid var(--border); }
  .left { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 0 20px; gap: 10px; width: 251px; height: 80px; border-right: 1px solid var(--border); }
  .logo { width: 89.63px; height: 40px; object-fit: contain; }
  .right { flex: 1 1 auto; align-self: stretch; display: flex; }
  .bar { display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 0 30px; gap: 24px; width: 100%; }
  .title { width: auto; height: 20px; font-family: 'Fund', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; font-style: normal; font-weight: 500; font-size: 16px; line-height: 20px; color: var(--text); }
  .theme-toggle { appearance: none; border-radius: 8px; padding: 8px 12px; font-size: 14px; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text); }
  .theme-toggle:hover { background: rgba(0,0,0,0.04); }
  @media (max-width: 900px) {
    .bar { padding: 0 16px; }
  }
</style>
<header class="header">
  <div class="left">
    <img class="logo" src="components/header/image.png" alt="PIF Logo" />
  </div>
  <div class="right">
    <div class="bar">
      <div class="title"></div>
      <button class="theme-toggle" type="button" aria-label="Toggle theme"></button>
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
      const button = root.querySelector('.theme-toggle');
      const getStoredTheme = () => {
        try { return localStorage.getItem('theme'); } catch(e) { return null; }
      };
      const setStoredTheme = (mode) => {
        try { localStorage.setItem('theme', mode); } catch(e) {}
      };
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
