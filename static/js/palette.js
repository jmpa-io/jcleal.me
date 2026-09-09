(function () {
  var PALETTES = ['ocean', 'forest', 'sunset', 'violet', 'yellow', 'grey', 'purple'];
  var PALETTE_KEY = 'jc-palette';

  function applyPalette(palette) {
    PALETTES.forEach(function (p) {
      document.documentElement.classList.remove(p);
    });
    if (palette && PALETTES.indexOf(palette) !== -1) {
      document.documentElement.classList.add(palette);
    }
    document.querySelectorAll('.jc-palette-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.palette === palette);
    });
  }

  function setPalette(palette) {
    var current = localStorage.getItem(PALETTE_KEY);
    if (current === palette) {
      localStorage.removeItem(PALETTE_KEY);
      applyPalette(null);
    } else {
      localStorage.setItem(PALETTE_KEY, palette);
      applyPalette(palette);
    }
  }

  // apply immediately to avoid flash
  applyPalette(localStorage.getItem(PALETTE_KEY));

  document.addEventListener('DOMContentLoaded', function () {
    var trigger = document.getElementById('jc-palette-trigger');
    var popup   = document.getElementById('jc-palette-popup');

    if (trigger && popup) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        popup.classList.toggle('open');
      });

      document.addEventListener('click', function (e) {
        if (!popup.contains(e.target) && e.target !== trigger) {
          popup.classList.remove('open');
        }
      });
    }

    document.querySelectorAll('.jc-palette-btn').forEach(function (btn) {
      var p = btn.dataset.palette;
      btn.classList.toggle('active', p === localStorage.getItem(PALETTE_KEY));
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setPalette(p);
        if (popup) popup.classList.remove('open');
      });
    });
  });
})();
