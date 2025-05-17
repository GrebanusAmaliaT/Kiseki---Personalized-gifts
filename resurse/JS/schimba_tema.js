window.addEventListener("DOMContentLoaded", function () {
  const teme = ["light", "dark", "neutral"];
  const icoana = document.getElementById("icoana-tema");
  const iconite = {
    light: "bi bi-sun-fill",
    dark: "bi bi-moon-stars-fill",
    neutral: "bi bi-circle-half"
  };

  let temaCurenta = localStorage.getItem("tema") || "light";
  document.body.className = temaCurenta;
  icoana.className = iconite[temaCurenta];

  document.getElementById("btn-tema").onclick = function () {
    let index = teme.indexOf(temaCurenta);
    temaCurenta = teme[(index + 1) % teme.length]; 

    document.body.className = temaCurenta;

    icoana.className = iconite[temaCurenta];

    localStorage.setItem("tema", temaCurenta);
  };
});

