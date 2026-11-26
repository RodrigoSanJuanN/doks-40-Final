/* ============================================================
   src/js/auth.js — Inicio de sesión (RU0001 y RU0026)
   ============================================================ */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (Store.data.session) {
    window.location.href = "app.html";
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPass");
  const btnReset = document.getElementById("btnReset");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const okEmail = Validators.email(emailInput);
    const okPass = Validators.minLen(passInput, 4);

    if (!okEmail || !okPass) {
      toast("Revisa los campos marcados en rojo.", "error");
      return;
    }

    const email = emailInput.value.trim();
    let nombre = email.split("@")[0].replace(/[._-]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()) || "Usuario";

    Store.data.session = {
      nombre,
      email,
      iniciales: nombre.slice(0, 2).toUpperCase()
    };
    Store.save();
    window.location.href = "app.html";
  });

  btnReset.addEventListener("click", () => {
    if (confirm("¿Volver a los datos de ejemplo?")) {
      Store.reset();
      toast("Datos de ejemplo restablecidos ✓", "success");
    }
  });
});
