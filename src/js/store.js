const LS_KEY = "gestion_proyectos_v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function toast(msg, type = "") {
  const box = document.getElementById("toasts");
  if (!box) return;

  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent =
    (type === "success" ? "✓ " :
     type === "error" ? "✕ " :
     type === "warn" ? "⚠ " : "") + msg;

  box.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function seedData() {
  return {
    session: null,
    activeProjectId: "PRJ-01",

    projects: [
      {
        id: "PRJ-01",
        nombre: "Proyecto de ejemplo",
        descripcion: "Proyecto de demostración para gestionar requisitos, usuarios y tareas.",
        modo: "Estándar",

        users: [
          { id: "u-1", nombre: "Usuario 1", rol: "Administrador" },
          { id: "u-2", nombre: "Usuario 2", rol: "Desarrollador" },
          { id: "u-3", nombre: "Usuario 3", rol: "Tester" }
        ],

        userReqs: [
          {
            id: "RU-01",
            titulo: "Gestionar información",
            descripcion: "El sistema permite registrar y consultar información.",
            tipo: "Funcional",
            prioridad: "Alta",
            vigente: true
          },
          {
            id: "RU-02",
            titulo: "Validar datos ingresados",
            descripcion: "El sistema verifica que los datos ingresados sean válidos.",
            tipo: "Funcional",
            prioridad: "Media",
            vigente: true
          }
        ],

        tasks: [
          {
            id: "T-01",
            titulo: "Definir los requisitos del proyecto",
            responsable: "u-1",
            limite: "2026-11-12"
          },
          {
            id: "T-02",
            titulo: "Diseñar la interfaz del sistema",
            responsable: "u-2",
            limite: "2026-11-20"
          }
        ]
      }
    ]
  };
}

const Store = {
  data: null,

  load() {
    try {
      this.data = JSON.parse(localStorage.getItem(LS_KEY)) || seedData();
    } catch (e) {
      this.data = seedData();
    }

    return this.data;
  },

  save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.data));
    } catch (e) {
      toast("No se pudo guardar en el navegador.", "error");
    }
  },

  reset() {
    localStorage.removeItem(LS_KEY);
    this.data = seedData();
    this.save();
  },

  getActiveProject() {
    if (!this.data) this.load();

    return this.data.projects.find(
      p => p.id === this.data.activeProjectId
    ) || this.data.projects[0] || null;
  },

  nextRuId(project) {
    let i = (project.userReqs?.length || 0) + 1;

    while (
      (project.userReqs || []).some(
        r => r.id === `RU-${String(i).padStart(2, "0")}`
      )
    ) {
      i++;
    }

    return `RU-${String(i).padStart(2, "0")}`;
  },

  uid(prefix = "ID") {
    return prefix + "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }
};

Store.load();