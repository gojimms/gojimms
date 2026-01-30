// Helpers
function applyTheme(mode){
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  // sync UI
  const btn = document.getElementById('themeBtn');
  const icon = document.getElementById('themeIcon');
  if (btn && icon) {
    btn.setAttribute('aria-pressed', String(isDark));
    icon.textContent = isDark ? '☀️' : '🌙'; // icon menunjukkan aksi berikutnya
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
}

// Init theme (localStorage > system preference)
(function initTheme(){
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
})();

// Toggle handler
function toggleTheme(){
  const isDark = document.body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

// Wire up button
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.addEventListener('click', toggleTheme);
});

// Mobile menu (tetap)
function toggleMenu(){
  const nav = document.getElementById('site-nav');
  const btn = document.querySelector('.hamburger');
  const isOpen = nav.classList.toggle('open');
  document.body.classList.toggle('menu-open', isOpen);
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

// Tutup saat klik link
document.addEventListener('click', (e)=>{
  if (e.target.matches('nav a')) {
    const nav = document.getElementById('site-nav');
    const btn = document.querySelector('.hamburger');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    if (btn) btn.setAttribute('aria-expanded','false');
  }
});

// Close menu on link click (mobile)
document.addEventListener('click', (e)=>{
  if (e.target.matches('nav a')) {
    const nav = document.querySelector('nav');
    nav.classList.remove('open');
  }
});
