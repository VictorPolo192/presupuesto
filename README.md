# Presupuesta mi web

API REST con **Node.js + Express (JavaScript)** que calcula presupuestos de proyectos web con tarifas controladas por el servidor. Incluye una interfaz **React** (ampliación opcional) que consume la API.

Módulo 0613 · Desarrollo web en entorno servidor · RA7 (CE 7.4, 7.6 y 7.7).

## Requisitos

- Node.js 18 o superior (probado con Node 25)
- npm

## Instalación

```bash
git clone https://github.com/VictorPolo192/presupuesto.git
cd presupuesto
npm install
```

Ejecuta `npm install` **una sola vez, desde la carpeta raíz**. El proyecto usa *npm workspaces*: lee los archivos **`package.json`** de la raíz, de `backend/` y de `frontend/` e instala todas las dependencias (`node_modules` no se incluye en el repositorio).

## Ejecución (desde la carpeta raíz)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca **el backend (API, puerto 3000)** y **el frontend (React, puerto 5173)** a la vez. Abre **http://localhost:5173** |
| `npm start` | Arranca solo el backend en http://localhost:3000 (si antes se ejecutó `npm run build`, también sirve la web en ese mismo puerto) |
| `npm run build` | Compila el frontend en `frontend/dist/` |
| `npm test` | Ejecuta las pruebas automáticas del backend (los 9 casos obligatorios y algunos más) |

**Puertos:** API → `3000` (se puede cambiar con la variable de entorno `PORT`). Web en desarrollo → `5173`; Vite redirige las peticiones `/api` a la API.

### Despliegue en Vercel

El proyecto incluye `vercel.json` y una función que conecta las rutas `/api/*` con Express. Importa el repositorio en Vercel desde la raíz; el comando de compilación y la carpeta de salida están configurados en el proyecto.

## Rutas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estado` | Devuelve `{ "status": "ok" }` |
| GET | `/api/tarifas` | Devuelve las tarifas que usa el servidor |
| POST | `/api/presupuesto` | Valida la solicitud y devuelve el presupuesto desglosado |

### Tarifas

| Concepto | Clave | Precio |
|---|---|---|
| Landing, incluida la primera página | `landing` | 300 € |
| Web corporativa, incluida la primera página | `corporativa` | 600 € |
| Cada página adicional a la primera | `paginaAdicional` | 50 € |
| Formulario de contacto | `formulario` | 80 € |
| Segundo idioma | `segundoIdioma` | 150 € |

### POST /api/presupuesto

Cabecera obligatoria: `Content-Type: application/json`

```json
{ "tipo": "corporativa", "paginas": 4, "formulario": true, "segundoIdioma": false }
```

Respuesta `200`:

```json
{ "base": 600, "paginasAdicionales": 150, "formulario": 80, "segundoIdioma": 0, "total": 830, "moneda": "EUR" }
```

Respuesta `400` (ejemplo):

```json
{ "error": "Solicitud incorrecta", "detalles": ["\"paginas\" debe estar entre 1 y 20 (recibido: 0)."] }
```

Ejemplo con curl (en PowerShell usa `curl.exe`):

```bash
curl -X POST http://localhost:3000/api/presupuesto -H "Content-Type: application/json" -d "{\"tipo\":\"corporativa\",\"paginas\":4,\"formulario\":true,\"segundoIdioma\":false}"
```

## Estructura del código

```
package.json             Raíz: workspaces y scripts (npm run dev arranca los dos)
backend/                 API con Node.js + Express
  package.json           Dependencias del backend (express)
  src/
    tarifas.js           Tarifas congeladas (Object.freeze): solo las controla el servidor
    validacion.js        validarSolicitud(): comprueba tipos y rangos y devuelve solo los 4 campos permitidos
    calculo.js           calcularPresupuesto(): función pura, separada del manejador de la ruta
    app.js               Aplicación Express y rutas
    server.js            Arranque del servidor (puerto)
  tests/api.test.js      Pruebas automáticas (node:test)
frontend/                Interfaz React (Vite)
  package.json           Dependencias del frontend (react, vite)
  vite.config.js         Proxy /api → http://localhost:3000
  index.html
  src/                   main.jsx, App.jsx, styles.css
```

### Ejemplo de validación

`paginas` se comprueba con `typeof paginas === 'number' && Number.isInteger(paginas)` y después el rango 1–20. Por eso `"4"` (cadena), `2.5`, `0` y `21` se rechazan con 400. Los booleanos se comprueban con `typeof x === 'boolean'`, así que `"false"` no se acepta.

Las propiedades adicionales (por ejemplo `"total": 1`) se ignoran: el validador devuelve un objeto nuevo con solo `tipo`, `paginas`, `formulario` y `segundoIdioma`.

### Ejemplo de cálculo (caso 2)

`Total = precio base + páginas adicionales + extras`

- Base corporativa: **600**
- Páginas adicionales: (4 − 1) × 50 = **150**
- Formulario: **80**
- Segundo idioma: **0**
- **Total = 830 €**

## Tabla de pruebas

Pruebas ejecutadas con `npm test` (y comprobadas también manualmente con curl). En los casos inválidos, el resto de campos es el del caso 2.

| Caso | Solicitud | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| — | `GET /api/estado` | 200 · `{"status":"ok"}` | 200 · `{"status":"ok"}` ✅ |
| — | `GET /api/tarifas` | 200 · tarifas | 200 · 300 / 600 / 50 / 80 / 150 ✅ |
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · Total 300 € | 200 · base 300, total **300** ✅ |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · Total 830 € | 200 · 600 + 150 + 80 + 0 = **830** ✅ |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · Total 580 € | 200 · 300 + 50 + 80 + 150 = **580** ✅ |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · Total 1.250 € | 200 · 300 + 950 = **1250** ✅ |
| 5 | `{"tipo":"corporativa","paginas":0,"formulario":true,"segundoIdioma":false}` | 400 | 400 · "paginas" debe estar entre 1 y 20 ✅ |
| 6 | `{"tipo":"corporativa","paginas":21,"formulario":true,"segundoIdioma":false}` | 400 | 400 · "paginas" debe estar entre 1 y 20 ✅ |
| 7 | `{"tipo":"corporativa","paginas":2.5,"formulario":true,"segundoIdioma":false}` | 400 | 400 · "paginas" debe ser un número entero ✅ |
| 8 | `{"tipo":"tienda","paginas":4,"formulario":true,"segundoIdioma":false}` | 400 | 400 · "tipo" debe ser "landing" o "corporativa" ✅ |
| 9 | `{"tipo":"corporativa","paginas":4,"formulario":"false","segundoIdioma":false}` | 400 | 400 · "formulario" debe ser un booleano ✅ |
| Extra | `paginas: "4"` (cadena) | 400 | 400 ✅ |
| Extra | Falta `segundoIdioma` | 400 | 400 ✅ |
| Extra | Caso 2 + `"total":1,"precio":1,"base":0` | 200 · Total 830 € | 200 · **830** (se ignoran) ✅ |
| Extra | Sin `Content-Type: application/json` | 400 | 400 ✅ |
| Extra | JSON mal formado | 400 | 400 ✅ |

Resultado de `npm test`: **16 pruebas superadas, 0 fallidas.**

Los presupuestos no se guardan en ninguna base de datos.
