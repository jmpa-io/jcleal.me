// jmpa-io shared palette + day/night core — master copy. Mirrored into
// jmpa.io, startpage.jcleal.me. Edit here first.
(function () {
  var PALETTES = ['ocean', 'forest', 'sunset', 'violet', 'yellow', 'grey', 'purple', 'crimson', 'teal'];

  function applyPalette(key, btnSelector) {
    PALETTES.forEach(function (p) { document.documentElement.classList.remove(p); });
    if (key && PALETTES.indexOf(key) !== -1) document.documentElement.classList.add(key);
    document.querySelectorAll(btnSelector).forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.palette === key);
    });
  }


  // ── custom colours (primary + secondary) ──
  var HEX = /^#[0-9a-f]{6}$/i;
  var CUSTOM_VARS = ['--pal-base', '--pal-base-dark', '--pal-base-2', '--pal-base-2-dark'];
  // Lightness ranges (oklch L) that keep the derived ramps readable on the
  // white / dark backgrounds; anything outside is pulled into range.
  var L_LIGHT = [0.38, 0.60];
  var L_DARK  = [0.45, 0.62];

  function ramp(hex, range) {
    return 'oklch(from ' + hex + ' clamp(' + range[0] + ', l, ' + range[1] + ') c h)';
  }

  // sRGB hex -> oklch lightness (Ottosson), used only to tell the user when a
  // colour had to be adjusted.
  function hexLightness(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
    var m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
    var s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
    return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  }

  function readCustom(key) {
    try {
      var c = JSON.parse(localStorage.getItem(key));
      if (c && HEX.test(c.primary) && HEX.test(c.secondary)) return c;
    } catch (e) { /* ignore corrupt storage */ }
    return null;
  }

  function applyCustom(c) {
    var style = document.documentElement.style;
    if (!c) {
      CUSTOM_VARS.forEach(function (v) { style.removeProperty(v); });
      return;
    }
    PALETTES.forEach(function (p) { document.documentElement.classList.remove(p); });
    style.setProperty('--pal-base', ramp(c.primary, L_LIGHT));
    style.setProperty('--pal-base-dark', ramp(c.primary, L_DARK));
    style.setProperty('--pal-base-2', ramp(c.secondary, L_LIGHT));
    style.setProperty('--pal-base-2-dark', ramp(c.secondary, L_DARK));
  }

  function adjustedNote(c) {
    var out = [];
    [['Primary', c.primary], ['Secondary', c.secondary]].forEach(function (x) {
      var l = hexLightness(x[1]);
      if (l < L_LIGHT[0] || l > L_LIGHT[1]) out.push(x[0]);
    });
    return out.length ? out.join(' and ') + ' adjusted so text stays readable.' : '';
  }

  function applyScheme(scheme, toggleEl, onScheme) {
    document.documentElement.classList.toggle('dark', scheme === 'dark');
    if (toggleEl) {
      toggleEl.classList.toggle('dark', scheme === 'dark');
      toggleEl.classList.toggle('light', scheme !== 'dark');
    }
    if (onScheme) onScheme(scheme, toggleEl);
  }

  window.Palette = {
    PALETTES: PALETTES,
    init: function (opts) {
      opts = opts || {};
      var paletteKey  = opts.paletteKey  || 'palette';
      var schemeKey   = opts.schemeKey   || 'scheme';
      var btnSelector = opts.btnSelector || '.palette-btn';
      var triggerId   = opts.triggerId;
      var popupId     = opts.popupId;
      var toggleId    = opts.toggleId;
      var onScheme    = opts.onScheme;
      var customKey   = opts.customKey || 'palette-custom';
      var customIds   = opts.customIds; // { primary, secondary, reset, note }

      // apply immediately to avoid a flash of the wrong theme/palette
      var storedCustom = customIds ? readCustom(customKey) : null;
      applyPalette(storedCustom ? null : localStorage.getItem(paletteKey), btnSelector);
      applyCustom(storedCustom);
      var scheme = localStorage.getItem(schemeKey) ||
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      applyScheme(scheme, toggleId ? document.getElementById(toggleId) : null, onScheme);

      document.addEventListener('DOMContentLoaded', function () {
        var trigger = triggerId && document.getElementById(triggerId);
        var popup   = popupId && document.getElementById(popupId);
        var toggle  = toggleId && document.getElementById(toggleId);

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

        if (customIds) {
          var primary   = document.getElementById(customIds.primary);
          var secondary = document.getElementById(customIds.secondary);
          var reset     = document.getElementById(customIds.reset);
          var note      = document.getElementById(customIds.note);
          if (primary && secondary) {
            var defaults = { primary: primary.value, secondary: secondary.value };
            if (storedCustom) {
              primary.value = storedCustom.primary;
              secondary.value = storedCustom.secondary;
              if (note) note.textContent = adjustedNote(storedCustom);
            }
            var onCustom = function () {
              var c = { primary: primary.value, secondary: secondary.value };
              if (!HEX.test(c.primary) || !HEX.test(c.secondary)) return;
              localStorage.setItem(customKey, JSON.stringify(c));
              localStorage.removeItem(paletteKey);
              applyPalette(null, btnSelector);
              applyCustom(c);
              if (note) note.textContent = adjustedNote(c);
            };
            primary.addEventListener('input', onCustom);
            secondary.addEventListener('input', onCustom);
            if (reset) {
              reset.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                localStorage.removeItem(customKey);
                localStorage.removeItem(paletteKey);
                applyCustom(null);
                applyPalette(null, btnSelector);
                primary.value = defaults.primary;
                secondary.value = defaults.secondary;
                if (note) note.textContent = '';
              });
            }
          }
        }

        document.querySelectorAll(btnSelector).forEach(function (btn) {
          var p = btn.dataset.palette;
          btn.classList.toggle('active', p === (storedCustom ? '' : (localStorage.getItem(paletteKey) || '')));
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var current = localStorage.getItem(paletteKey);
            if (customIds) {
              localStorage.removeItem(customKey);
              applyCustom(null);
            }
            if (current === p) {
              localStorage.removeItem(paletteKey);
              applyPalette(null, btnSelector);
            } else {
              localStorage.setItem(paletteKey, p);
              applyPalette(p, btnSelector);
            }
            if (popup) popup.classList.remove('open');
          });
        });

        if (toggle) {
          applyScheme(localStorage.getItem(schemeKey) || scheme, toggle, onScheme);
          toggle.addEventListener('click', function () {
            var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem(schemeKey, next);
            applyScheme(next, toggle, onScheme);
          });
        }
      });
    }
  };
})();
