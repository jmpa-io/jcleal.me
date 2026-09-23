document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("scheme-toggle");

  var htmlEl = document.documentElement;
  var scheme = htmlEl.classList.contains("dark") ? "dark" : "light";
  var savedScheme = localStorage.getItem("scheme");

  if (savedScheme) { scheme = savedScheme; }

  if (scheme === "dark") {
    darkscheme(toggle);
  } else {
    lightscheme(toggle);
  }

  toggle.addEventListener("click", function () {
    if (toggle.classList.contains("light")) {
      darkscheme(toggle);
    } else {
      lightscheme(toggle);
    }
  });
});

function darkscheme(toggle) {
  localStorage.setItem("scheme", "dark");
  toggle.innerHTML = feather.icons.sun.toSvg();
  toggle.classList.remove("light");
  toggle.classList.add("dark");
  document.documentElement.classList.add("dark");
}

function lightscheme(toggle) {
  localStorage.setItem("scheme", "light");
  toggle.innerHTML = feather.icons.moon.toSvg();
  toggle.classList.remove("dark");
  toggle.classList.add("light");
  document.documentElement.classList.remove("dark");
}
