(function () {
  try {
    var saved = localStorage.getItem('gopaq_theme');
    var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (_) {}
}());
