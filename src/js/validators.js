/* ============================================================
   src/js/validators.js — Validación de datos en cliente (RU0026)
   ============================================================ */
"use strict";

const Validators = {
  markField(inputEl, isInvalid) {
    if (!inputEl) return false;
    const fieldWrap = inputEl.closest(".field");
    if (fieldWrap) {
      fieldWrap.classList.toggle("invalid", isInvalid);
    }
    return !isInvalid;
  },

  minLen(inputEl, minLength) {
    const val = (inputEl?.value || "").trim();
    const isInvalid = val.length < minLength;
    return this.markField(inputEl, isInvalid);
  },

  email(inputEl) {
    const val = (inputEl?.value || "").trim();
    const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const isInvalid = !regex.test(val);
    return this.markField(inputEl, isInvalid);
  },

  required(inputEl) {
    const val = (inputEl?.value || "").trim();
    const isInvalid = val === "";
    return this.markField(inputEl, isInvalid);
  },

  clearFormErrors(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll(".field.invalid").forEach(f => f.classList.remove("invalid"));
  }
};
