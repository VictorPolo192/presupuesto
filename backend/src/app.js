import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { TARIFAS, MONEDA } from './tarifas.js';
import { validarSolicitud } from './validacion.js';
import { calcularPresupuesto } from './calculo.js';

export const app = express();

app.use(express.json());

// GET /api/estado → comprueba que el servicio funciona
app.get('/api/estado', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/tarifas → tarifas que usa el servidor
app.get('/api/tarifas', (req, res) => {
  res.json({ moneda: MONEDA, tarifas: TARIFAS });
});

// POST /api/presupuesto → valida y calcula
app.post('/api/presupuesto', (req, res) => {
  if (!req.is('application/json')) {
    return res.status(400).json({
      error: 'Solicitud incorrecta',
      detalles: ['La petición debe usar la cabecera Content-Type: application/json.']
    });
  }

  const resultado = validarSolicitud(req.body);
  if (!resultado.ok) {
    return res.status(400).json({ error: 'Solicitud incorrecta', detalles: resultado.errores });
  }

  res.status(200).json(calcularPresupuesto(resultado.datos));
});

// Rutas /api inexistentes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Si existe el frontend compilado (npm run build), se sirve desde aquí
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
}

// JSON mal formado u otros errores
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Solicitud incorrecta',
      detalles: ['El cuerpo no es un JSON válido.']
    });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});
