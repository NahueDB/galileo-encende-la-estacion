export const solutions = [
  ['"#estacion"'],
  ['estado.textContent = "El taller está disponible para trabajar";'],
  ['boton.addEventListener("click", encender);'],
  [
    'estado.textContent = "Estación en funcionamiento";',
    'estado.textContent = "Estación detenida";',
  ],
  ['const nombre = campo.value;\nmensaje.textContent = "Estación asignada a " + nombre;'],
  [
    'function registrar() {\n const nombre = campo.value.trim();\n if (nombre === "") {\n mensaje.textContent = "Ingresá el nombre de la persona responsable";\n } else {\n mensaje.textContent = "Estación asignada a " + nombre;\n }\n}\nfunction limpiar() {\n campo.value = "";\n mensaje.textContent = "No hay una persona registrada";\n}\nboton.addEventListener("click", registrar);\nbotonLimpiar.addEventListener("click", limpiar);',
  ],
];
