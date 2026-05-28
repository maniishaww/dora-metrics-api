const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { incidentCounter } = require('../monitoring/metrics');

router.post('/', (req, res) => {
  const { started_at, resolved_at, caused_by_deployment, severity } = req.body;

  if (!started_at) {
    return res.status(400).json({ 
      error: 'started_at is required' 
    });
  }

  if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({ 
      error: 'severity must be low, medium, high or critical' 
    });
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO incidents (id, started_at, resolved_at, caused_by_deployment, severity)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    started_at,
    resolved_at || null,
    caused_by_deployment ? 1 : 0,
    severity || 'medium'
  );

  incidentCounter.inc({ severity: severity || 'medium' });

  return res.status(201).json({
    id,
    started_at,
    resolved_at: resolved_at || null,
    caused_by_deployment: caused_by_deployment || false,
    severity: severity || 'medium'
  });
});

router.get('/', (req, res) => {
  const incidents = db.prepare('SELECT * FROM incidents ORDER BY started_at DESC').all();
  return res.json(incidents);
});

router.patch('/:id/resolve', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const resolved_at = new Date().toISOString();

  db.prepare('UPDATE incidents SET resolved_at = ? WHERE id = ?').run(resolved_at, id);

  return res.json({
    id,
    resolved_at,
    message: 'Incident resolved'
  });
});

module.exports = router;