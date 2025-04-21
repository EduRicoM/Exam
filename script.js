let modo = "";
let preguntas = [];
let respuestasUsuario = [];
let preguntaActual = 0;
let tiempoRestante = 0;
let temporizadorInterval = null;

function startModo(m) {
  modo = m;
  document.getElementById("menu").style.display = "none";
  document.getElementById("config").style.display = "flex";

  let titulo = {
    examen: "Modo Examen - Simulacro completo",
    aleatorio: "Modo Aleatorio - Preguntas sueltas",
    rapido: "Modo Examen Rápido (30 preguntas)"
  }[m];
  document.getElementById("modoTitulo").innerText = titulo;

  if (modo === "examen") {
    document.getElementById("simulacroSelectContainer").style.display = "block";
    fetch("new_data/simulacros.json")
      .then(res => res.json())
      .then(lista => {
        const select = document.getElementById("simulacroSelect");
        select.innerHTML = "";
        lista.forEach(nombre => {
          const opt = document.createElement("option");
          opt.value = nombre;
          opt.textContent = nombre;
          select.appendChild(opt);
        });
      });
  }
}

function comenzar() {
  document.getElementById("config").style.display = "none";
  document.getElementById("test").style.display = "block";
  respuestasUsuario = [];
  preguntaActual = 0;

  if (modo === "examen") {
    const archivo = document.getElementById("simulacroSelect").value;
    fetch(`new_data/${archivo}`)
      .then(res => res.json())
      .then(data => {
        preguntas = data;
        tiempoRestante = 4.5 * 60 * 60;
        iniciarTemporizador();
        mostrarPregunta();
      });
  } else {
    fetch("new_data/simulacros.json")
      .then(res => res.json())
      .then(async lista => {
        preguntas = [];
        for (let archivo of lista) {
          const res = await fetch(`new_data/${archivo}`);
          const data = await res.json();
          preguntas = preguntas.concat(data);
        }
        if (modo === "rapido") {
          preguntas = preguntas.sort(() => Math.random() - 0.5).slice(0, 30);
          tiempoRestante = 45 * 60;
          iniciarTemporizador();
        }
        if (modo === "aleatorio") {
          preguntas = preguntas.sort(() => Math.random() - 0.5);
        }
        mostrarPregunta();
      });
  }
}

function iniciarTemporizador() {
  actualizarTemporizador();
  temporizadorInterval = setInterval(() => {
    tiempoRestante--;
    actualizarTemporizador();
    if (tiempoRestante <= 0) {
      clearInterval(temporizadorInterval);
      entregar();
    }
  }, 1000);
}

function actualizarTemporizador() {
  const h = Math.floor(tiempoRestante / 3600);
  const m = Math.floor((tiempoRestante % 3600) / 60);
  const s = tiempoRestante % 60;
  document.getElementById("temporizador").innerText = `${h}h ${m}m ${s}s`;
}

function mostrarPregunta() {
  const p = preguntas[preguntaActual];
  const cont = document.getElementById("preguntaContainer");
  cont.innerHTML = `<h3>Pregunta ${preguntaActual + 1}:</h3><p>${p.pregunta}</p>`;

  p.opciones.forEach((op, idx) => {
    const div = document.createElement("div");
    div.className = "opcion";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "respuesta";
    input.value = idx + 1;
    if (respuestasUsuario[preguntaActual] == idx + 1) {
      input.checked = true;
    }
    input.onchange = () => seleccionar(idx + 1);
    div.appendChild(input);
    const label = document.createElement("label");
    label.textContent = " " + op;
    div.appendChild(label);
    cont.appendChild(div);
  });

  if (modo === "aleatorio" && respuestasUsuario[preguntaActual]) {
    mostrarResultadoPregunta(preguntaActual);
  }
}

function seleccionar(opcion) {
  respuestasUsuario[preguntaActual] = opcion;
  if (modo === "aleatorio") {
    mostrarResultadoPregunta(preguntaActual);
  }
}

function mostrarResultadoPregunta(index) {
  const correcta = preguntas[index].respuesta;
  const opcionesDivs = document.querySelectorAll(".opcion");
  opcionesDivs.forEach((div, idx) => {
    if (idx + 1 == correcta) div.classList.add("correcta");
    else if (idx + 1 == respuestasUsuario[index]) div.classList.add("incorrecta");
  });

  const comentario = preguntas[index].comentario;
  if (comentario) {
    const comentarioDiv = document.createElement("div");
    comentarioDiv.innerHTML = `<em>Comentario:</em> ${comentario}`;
    document.getElementById("preguntaContainer").appendChild(comentarioDiv);
  }
}

function siguientePregunta() {
  if (modo === "aleatorio") {
    preguntaActual = Math.floor(Math.random() * preguntas.length);
    mostrarPregunta();
    return;
  }
  if (preguntaActual < preguntas.length - 1) {
    preguntaActual++;
    mostrarPregunta();
  }
}

function anteriorPregunta() {
  if (preguntaActual > 0) {
    preguntaActual--;
    mostrarPregunta();
  }
}

function entregar() {
  clearInterval(temporizadorInterval);
  document.getElementById("test").style.display = "none";
  document.getElementById("resultado").style.display = "block";

  let aciertos = 0;
  const repasoHTML = preguntas.map((p, i) => {
    if (modo === "aleatorio" && respuestasUsuario[i] == null) return "";
    const correcta = p.respuesta;
    const usuario = respuestasUsuario[i] || "-";
    const acertado = usuario == correcta;
    if (acertado) aciertos++;
    return `
      <div>
        <strong>Pregunta ${i + 1}:</strong> ${p.pregunta}<br>
        ${p.opciones.map((opt, idx) => `<div>${opt}</div>`).join("")}<br>
        <span style="color:${acertado ? 'green' : 'red'}">Tu respuesta: ${usuario}</span><br>
        Respuesta correcta: ${correcta}<br>
        ${p.comentario ? '<em>Comentario:</em> ' + p.comentario : ''}
        <hr>
      </div>
    `;
  }).join("");

  document.getElementById("resumen").innerText = `Has acertado ${aciertos} de ${preguntas.filter((_, i) => respuestasUsuario[i] != null).length}`;
  document.getElementById("repaso").innerHTML = repasoHTML;
}
