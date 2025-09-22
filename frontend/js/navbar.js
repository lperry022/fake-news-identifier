document.addEventListener("DOMContentLoaded", () => {
  fetch("/frontend/partials/navbar.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("navbar-container").innerHTML = html;
      initNavState();
    });
});

function initNavState() {
  const isLoggedIn = Boolean(localStorage.getItem("userToken")); 

  document.querySelectorAll(".auth-logged-in").forEach(el => {
    el.style.display = isLoggedIn ? "" : "none";
  });
  document.querySelectorAll(".auth-logged-out").forEach(el => {
    el.style.display = isLoggedIn ? "none" : "";
  });
}
