/* ============================================================
   src/js/app.js — Controlador de Vista 1 y Vista 2 (Con eliminación de proyectos)
   ============================================================ */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // RU0001: Verificar sesión activa
  if (!Store.data.session) {
    window.location.href = "login.html";
    return;
  }

  const $ = (id) => document.getElementById(id);

  // Mostrar usuario y botón Salir (RU0001)
  $("userName").textContent = Store.data.session.nombre;
  $("userAvatar").textContent = Store.data.session.iniciales;
  $("btnLogout").addEventListener("click", () => {
    Store.data.session = null;
    Store.save();
    window.location.href = "login.html";
  });

  // RU0028: Navegación minimalista de solo 2 vistas principales
  const navLinks = document.querySelectorAll(".nav-links a");
  function showView(viewId) {
    $("view-vista1").classList.toggle("hidden", viewId !== "vista1");
    $("view-vista2").classList.toggle("hidden", viewId !== "vista2");
    navLinks.forEach(a => a.classList.toggle("active", a.dataset.view === viewId));
    $("step1").classList.toggle("active", viewId === "vista1");
    $("step2").classList.toggle("active", viewId === "vista2");
    renderAll();
  }

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showView(a.dataset.view);
    });
  });
  $("step1").addEventListener("click", () => showView("vista1"));
  $("step2").addEventListener("click", () => showView("vista2"));

  // Selector de proyecto en barra lateral (RU0003)
  $("projSelect").addEventListener("change", (e) => {
    Store.data.activeProjectId = e.target.value;
    Store.save();
    loadProjectIntoForm(Store.getActiveProject());
    resetRuForm();
    renderAll();
  });

  // RU0017: Selector de Modo Estándar / Modo Simplificado con efecto inmediato
  $("modeSelect").addEventListener("change", (e) => {
    const p = Store.getActiveProject();
    if (!p) return;
    p.modo = e.target.value;
    $("projModoForm").value = p.modo;
    Store.save();
    renderAll();
    toast(`Modo cambiado a ${p.modo} ✓`, "success");
  });

  /* ==========================================================
     VISTA 1: CREACIÓN, EDICIÓN Y ELIMINACIÓN DE PROYECTOS (RU0002, RU0003)
     ========================================================== */
  function loadProjectIntoForm(p) {
    Validators.clearFormErrors($("projForm"));
    if (!p) {
      $("projFormTitle").textContent = "Crear Nuevo Proyecto";
      $("projId").value = "";
      $("projNombre").value = "";
      $("projDesc").value = "";
      $("projModoForm").value = "Estándar";
      $("btnSaveProj").textContent = "+ Crear proyecto ✓";
      return;
    }
    $("projFormTitle").textContent = "Editar Proyecto: " + p.nombre;
    $("projId").value = p.id;
    $("projNombre").value = p.nombre;
    $("projDesc").value = p.descripcion;
    $("projModoForm").value = p.modo || "Estándar";
    $("btnSaveProj").textContent = "Guardar cambios ✓";
  }

  $("btnNewProjMode").addEventListener("click", () => {
    loadProjectIntoForm(null);
    $("projNombre").focus();
  });

  $("projForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const okName = Validators.minLen($("projNombre"), 4);
    const okDesc = Validators.minLen($("projDesc"), 10);
    if (!okName || !okDesc) {
      toast("Revisa lo marcado en rojo (nombre mín. 4, descripción mín. 10).", "error");
      return;
    }

    const id = $("projId").value;
    const nombre = $("projNombre").value.trim();
    const descripcion = $("projDesc").value.trim();
    const modo = $("projModoForm").value;

    if (id) {
      // RU0003: Editar proyecto seleccionado
      const p = Store.data.projects.find(x => x.id === id);
      if (p) {
        p.nombre = nombre;
        p.descripcion = descripcion;
        p.modo = modo;
        toast("Proyecto actualizado ✓", "success");
      }
    } else {
      // RU0002: Crear proyecto nuevo
      const nuevo = {
        id: Store.uid("PRJ"),
        nombre,
        descripcion,
        modo,
        users: [
          { id: Store.uid("U"), nombre: Store.data.session.nombre, rol: "Jefe de proyecto" }
        ],
        userReqs: [],
        tasks: []
      };
      Store.data.projects.push(nuevo);
      Store.data.activeProjectId = nuevo.id;
      loadProjectIntoForm(nuevo);
      toast("Proyecto creado ✓", "success");
    }

    Store.save();
    renderAll();
  });

  /* ==========================================================
     VISTA 1: INTEGRANTES Y ROLES (RU0004)
     ========================================================== */
  $("memberForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = Store.getActiveProject();
    if (!p) {
      toast("Primero crea un proyecto para agregar integrantes.", "warn");
      return;
    }

    if (!Validators.minLen($("memNombre"), 3)) {
      toast("Escribe el nombre del integrante (mínimo 3 letras).", "error");
      return;
    }

    p.users.push({
      id: Store.uid("U"),
      nombre: $("memNombre").value.trim(),
      rol: $("memRol").value
    });

    $("memNombre").value = "";
    Validators.clearFormErrors($("memberForm"));
    Store.save();
    renderAll();
    toast("Integrante agregado al equipo ✓", "success");
  });

  /* ==========================================================
     VISTA 2: REQUISITOS DE USUARIO (RU0005)
     ========================================================== */
  function resetRuForm() {
    Validators.clearFormErrors($("ruForm"));
    $("ruFormTitle").textContent = "Requisitos de Usuario";
    $("ruEditId").value = "";
    $("ruTitulo").value = "";
    $("ruDesc").value = "";
    $("ruTipo").value = "Funcional";
    $("ruPrio").value = "Alta";
    $("ruVigencia").value = "true";
    $("btnSaveRu").textContent = "+ Guardar requisito";
    $("btnCancelRuEdit").classList.add("hidden");
  }

  $("btnCancelRuEdit").addEventListener("click", resetRuForm);

  $("ruForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = Store.getActiveProject();
    if (!p) {
      toast("Primero crea un proyecto en la.", "warn");
      return;
    }

    const okTit = Validators.minLen($("ruTitulo"), 4);
    const okDesc = Validators.minLen($("ruDesc"), 10);
    if (!okTit || !okDesc) {
      toast("Revisa los campos en rojo (título mín. 4, descripción mín. 10).", "error");
      return;
    }

    const editId = $("ruEditId").value;
    const datos = {
      titulo: $("ruTitulo").value.trim(),
      descripcion: $("ruDesc").value.trim(),
      tipo: $("ruTipo").value,
      prioridad: $("ruPrio").value,
      vigente: $("ruVigencia").value === "true"
    };

    if (editId) {
      const ru = p.userReqs.find(r => r.id === editId);
      if (ru) Object.assign(ru, datos);
      toast(`Requisito ${editId} editado ✓`, "success");
    } else {
      const nuevoId = Store.nextRuId(p);
      p.userReqs.push({ id: nuevoId, ...datos });
      toast(`Requisito ${nuevoId} agregado ✓`, "success");
    }

    resetRuForm();
    Store.save();
    renderAll();
  });

  /* ==========================================================
     VISTA 2: TAREAS (RU0023, RU0024, RU0025)
     ========================================================== */
  $("taskFecha").value = todayISO();

  $("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = Store.getActiveProject();
    if (!p) {
      toast("Primero crea un proyecto en la.", "warn");
      return;
    }

    const okTit = Validators.minLen($("taskTitulo"), 4);
    const okResp = Validators.required($("taskResp"));
    const okFecha = Validators.required($("taskFecha"));

    if (!okTit || !okResp || !okFecha) {
      toast("Completa la descripción, el responsable y la fecha límite.", "error");
      return;
    }

    p.tasks.push({
      id: Store.uid("T"),
      titulo: $("taskTitulo").value.trim(),
      responsable: $("taskResp").value,
      limite: $("taskFecha").value
    });

    $("taskTitulo").value = "";
    $("taskFecha").value = todayISO();
    Validators.clearFormErrors($("taskForm"));
    Store.save();
    renderAll();
    toast("Tarea registrada ✓", "success");
  });

  /* ==========================================================
     RENDERIZADO GENERAL DE AMBAS VISTAS
     ========================================================== */
  function renderAll() {
    const p = Store.getActiveProject();

    // Si no existen proyectos (porque el usuario eliminó todos)
    if (!p) {
      $("projSelect").innerHTML = `<option value="">Sin proyectos</option>`;
      $("projTitle").textContent = "Sin proyecto activo";
      $("projMeta").textContent = "Crea un nuevo proyecto en el formulario para comenzar.";
      $("projStatsBadge").textContent = "0 proyectos";
      $("projList").innerHTML = `<p style="color:var(--text-secondary)">No hay proyectos registrados. Usa el formulario de arriba para crear el primero.</p>`;
      $("teamList").innerHTML = `<p style="color:var(--text-secondary)">Crea un proyecto primero.</p>`;
      $("ruList").innerHTML = `<p style="color:var(--text-secondary)">Crea un proyecto primero.</p>`;
      $("taskResp").innerHTML = `<option value="">— Sin proyecto —</option>`;
      $("taskList").innerHTML = `<p style="color:var(--text-secondary)">Crea un proyecto primero.</p>`;
      loadProjectIntoForm(null);
      return;
    }

    $("projSelect").innerHTML = Store.data.projects.map(x =>
      `<option value="${esc(x.id)}" ${x.id === p.id ? "selected" : ""}>${esc(x.nombre)}</option>`
    ).join("");

    const isSimple = p.modo === "Simplificado";
    $("projTitle").textContent = p.nombre;
    $("projMeta").textContent = p.descripcion;
    $("modeSelect").value = p.modo || "Estándar";

    const vigCount = p.userReqs.filter(r => r.vigente).length;
    $("projStatsBadge").textContent = `${p.users.length} integrantes · ${vigCount}/${p.userReqs.length} RU vigentes · ${p.tasks.length} tareas`;

    const mb = $("modeBadge");
    mb.textContent = isSimple ? "MODO SIMPLIFICADO" : "MODO ESTÁNDAR";
    mb.className = "mode-badge " + (isSimple ? "simplificado" : "estandar");

    // RU0017: En Modo Simplificado se simplifica el formulario ocultando Tipo y Prioridad
    $("ruStandardFields").classList.toggle("hidden", isSimple);

    // Lista de proyectos en Vista 1 (Con botón Seleccionar/Editar y botón Eliminar)
    $("projList").innerHTML = Store.data.projects.map(proj => `
      <div class="task" style="${proj.id === p.id ? "border-left:6px solid var(--seal);background:var(--paper)" : ""}">
        <div>
          <div class="task-title">${esc(proj.nombre)} <span class="mode-badge ${proj.modo === "Simplificado" ? "simplificado" : "estandar"}">${esc(proj.modo)}</span></div>
          <div class="task-meta">${esc(proj.descripcion)}</div>
        </div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button type="button" class="btn btn-default btn-sm" data-selproj="${esc(proj.id)}">
            ${proj.id === p.id ? "Editando" : "Seleccionar y editar"}
          </button>
          <button type="button" class="btn btn-danger btn-sm" data-delproj="${esc(proj.id)}">
            Eliminar
          </button>
        </div>
      </div>
    `).join("");

    // Evento: Seleccionar proyecto
    document.querySelectorAll("[data-selproj]").forEach(b => {
      b.onclick = () => {
        Store.data.activeProjectId = b.dataset.selproj;
        Store.save();
        loadProjectIntoForm(Store.getActiveProject());
        renderAll();
      };
    });

    // Evento: Eliminar proyecto
    document.querySelectorAll("[data-delproj]").forEach(b => {
      b.onclick = () => {
        const target = Store.data.projects.find(x => x.id === b.dataset.delproj);
        if (!target) return;
        if (!confirm(`¿Seguro que deseas eliminar el proyecto "${target.nombre}"?`)) return;

        Store.data.projects = Store.data.projects.filter(x => x.id !== target.id);
        if (Store.data.activeProjectId === target.id) {
          Store.data.activeProjectId = Store.data.projects[0]?.id || null;
        }
        Store.save();
        loadProjectIntoForm(Store.getActiveProject());
        resetRuForm();
        renderAll();
        toast("Proyecto eliminado.", "warn");
      };
    });

    // Lista de integrantes en Vista 1 (RU0004)
    $("teamList").innerHTML = p.users.length ? p.users.map(u => `
      <div class="task">
        <div>
          <div class="task-title">${esc(u.nombre)}</div>
          <div class="task-meta">${esc(u.rol)}</div>
        </div>
        <button type="button" class="btn btn-default btn-sm" data-udel="${esc(u.id)}">Quitar</button>
      </div>
    `).join("") : `<p style="color:var(--text-secondary)">Sin integrantes registrados.</p>`;

    document.querySelectorAll("[data-udel]").forEach(b => {
      b.onclick = () => {
        p.users = p.users.filter(u => u.id !== b.dataset.udel);
        Store.save();
        renderAll();
        toast("Integrante quitado del proyecto.", "warn");
      };
    });

    // Lista de Requisitos de Usuario en Vista 2 (RU0005)
    $("ruList").innerHTML = p.userReqs.length ? p.userReqs.map(ru => `
      <div class="elem open">
        <div class="elem-head" style="cursor:default">
          <span style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap">
            <span class="elem-id">${esc(ru.id)}</span>
            <b>${esc(ru.titulo)}</b>
            <span class="status-pill ${ru.vigente ? "success" : "danger"}">${ru.vigente ? "Vigente" : "No vigente"}</span>
          </span>
        </div>
        <div class="elem-body" style="display:block">
          <dl class="kv">
            <dt>Descripción</dt><dd>${esc(ru.descripcion)}</dd>
            ${!isSimple ? `<dt>Atributos</dt><dd>Tipo: ${esc(ru.tipo || "Funcional")}, Prioridad: ${esc(ru.prioridad || "Media")}</dd>` : ""}
          </dl>
          <div class="elem-actions">
            <button type="button" class="btn btn-default btn-sm" data-editru="${esc(ru.id)}">Editar en formulario</button>
            <button type="button" class="btn btn-default btn-sm" data-vigru="${esc(ru.id)}">
              Cambiar a ${ru.vigente ? "No vigente" : "Vigente"}
            </button>
          </div>
        </div>
      </div>
    `).join("") : `<p style="color:var(--text-secondary)">Sin requisitos de usuario registrados.</p>`;

    document.querySelectorAll("[data-editru]").forEach(b => {
      b.onclick = () => {
        const ru = p.userReqs.find(r => r.id === b.dataset.editru);
        if (!ru) return;
        Validators.clearFormErrors($("ruForm"));
        $("ruFormTitle").textContent = "Editando " + ru.id;
        $("ruEditId").value = ru.id;
        $("ruTitulo").value = ru.titulo;
        $("ruDesc").value = ru.descripcion;
        $("ruTipo").value = ru.tipo || "Funcional";
        $("ruPrio").value = ru.prioridad || "Alta";
        $("ruVigencia").value = String(ru.vigente);
        $("btnSaveRu").textContent = "Guardar cambios ✓";
        $("btnCancelRuEdit").classList.remove("hidden");
        $("ruTitulo").focus();
      };
    });

    document.querySelectorAll("[data-vigru]").forEach(b => {
      b.onclick = () => {
        const ru = p.userReqs.find(r => r.id === b.dataset.vigru);
        if (!ru) return;
        ru.vigente = !ru.vigente;
        Store.save();
        renderAll();
        toast(`${ru.id} ahora está ${ru.vigente ? "Vigente" : "No vigente"}.`, "warn");
      };
    });

    // Selector de integrantes para tareas (RU0024) y lista de tareas (RU0023, RU0025)
    $("taskResp").innerHTML = p.users.length
      ? p.users.map(u => `<option value="${esc(u.id)}">${esc(u.nombre)} — ${esc(u.rol)}</option>`).join("")
      : `<option value="">— Primero agrega integrantes en Vista 1 —</option>`;

    $("taskList").innerHTML = p.tasks.length ? [...p.tasks].sort((a, b) => a.limite.localeCompare(b.limite)).map(t => {
      const u = p.users.find(x => x.id === t.responsable);
      const venc = t.limite < todayISO();
      return `
        <div class="task">
          <div>
            <div class="task-title">
              <span class="dot ${venc ? "red" : "green"}"></span>${esc(t.titulo)}
            </div>
            <div class="task-meta">
              Responsable: <b>${esc(u ? u.nombre + " (" + u.rol + ")" : "Sin asignar")}</b> · Para el <b>${esc(t.limite)}</b>
            </div>
          </div>
          <button type="button" class="btn btn-default btn-sm" data-tdel="${esc(t.id)}">Quitar</button>
        </div>
      `;
    }).join("") : `<p style="color:var(--text-secondary)">Sin tareas registradas.</p>`;

    document.querySelectorAll("[data-tdel]").forEach(b => {
      b.onclick = () => {
        p.tasks = p.tasks.filter(t => t.id !== b.dataset.tdel);
        Store.save();
        renderAll();
      };
    });
  }

  loadProjectIntoForm(Store.getActiveProject());
  renderAll();
});