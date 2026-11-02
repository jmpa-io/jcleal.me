Palette.init({
  defaults: { primary: '#2f6fd6', secondary: '#000000' },
  defaultScheme: 'dark',
  triggerId: 'jc-palette-trigger',
  popupId: 'jc-palette-popup',
  customIds: { primary: 'jc-custom-primary', secondary: 'jc-custom-secondary', reset: 'jc-custom-reset', note: 'jc-custom-note' },
  toggleId: 'scheme-toggle',
  onScheme: function (scheme, toggle) {
    if (!toggle) return;
    var a = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    toggle.innerHTML = scheme === 'dark'
      ? a + '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : a + '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
});
