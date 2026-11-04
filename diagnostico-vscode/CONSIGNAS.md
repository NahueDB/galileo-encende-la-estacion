# Misiones del diagnóstico

Trabajen en pareja. Completen solamente los bloques marcados de cada archivo.

## 1. Encender el panel

Archivo: `ejercicios/01.js` · 5 minutos orientativos.

Completá encenderPanel(): buscá el párrafo con id estado y cambiá su texto por «Panel encendido». El evento del botón ya está preparado; el panel debe esperar al clic.

Comprobamos: Espera al clic; Actualiza el párrafo correcto.

## 2. Registrar al operador

Archivo: `ejercicios/02.js` · 7 minutos orientativos.

Completá registrar(): leé el valor actual de campo y mostrá «Estación asignada a [nombre]» en mensaje. El evento ya está preparado. Cada clic debe usar el nombre que esté escrito en ese momento.

Comprobamos: Mensaje inicial; Dos nombres sin reiniciar.

## 3. Revisar las baterías

Archivo: `ejercicios/03.js` · 8 minutos orientativos.

Completá contarBaterias(cargas, minimo). Devolvé cuántas cargas son mayores o iguales a minimo. No modifiques la lista recibida. Una lista vacía debe devolver 0. Podés usar for, while o for...of.

Comprobamos: Recorrido y umbral incluido; Otra lista y otro umbral; Lista vacía; Conserva la lista original.

## 4. Calcular el consumo

Archivo: `ejercicios/04.js` · 7 minutos orientativos.

Completá calcularConsumo(potencia, horas). Devolvé potencia multiplicada por horas. La función recibe números no negativos; debe devolver un número, sin imprimirlo ni modificar el HTML desde su cuerpo.

Comprobamos: Dos parámetros distintos; Potencia o tiempo cero; Valores decimales.

## 5. Crear los robots

Archivo: `ejercicios/05.js` · 10 minutos orientativos.

Completá constructor(nombre, energia) y presentarse(). Cada Robot guarda su propio nombre y energia. presentarse() devuelve «Soy [nombre] y tengo [energia] de energía». Probamos dos robots con datos diferentes.

Comprobamos: Guarda los parámetros; Presenta dos robots; Instancias independientes.

## 6. Proteger la energía

Archivo: `ejercicios/06.js` · 12 minutos orientativos.

El atributo privado #energia y el constructor ya están preparados. Completá get energia y set energia(valor). El getter devuelve la carga. El setter acepta valores entre 0 y 100 inclusive; si el valor está fuera del rango, conserva la carga anterior.

Comprobamos: Lectura del valor privado; Acepta 0 y 100; Rechaza negativos y más de 100; No mezcla instancias.

## 7. Instalar una batería

Archivo: `ejercicios/07.js` · 12 minutos orientativos.

Robot recibe un objeto Bateria ya creado. Completá trabajar(costo) para delegar en consumir(costo) de esa batería y devolver su resultado booleano. Completá energiaDisponible() para devolver la energía de la batería. No crees una carga paralela en el robot. Bateria ya resuelve si alcanza la energía.

Comprobamos: Consume en la batería recibida; Rechaza consumo insuficiente; Consumo exacto y cero; Componentes independientes.

## 8. Activar al robot especialista

Archivo: `ejercicios/08.js` · 14 minutos orientativos.

RobotReparador ya extiende Robot. Completá su constructor(nombre, herramienta): inicializá la parte heredada con super y guardá herramienta. Sobrescribí trabajar() para devolver «[nombre] repara con [herramienta]». Debe conservar identificar(), heredado de Robot, que devuelve el nombre.

Comprobamos: Inicializa al padre y la herramienta; Conserva un método heredado; Sobrescribe trabajar; Otra instancia y clase base intacta.
