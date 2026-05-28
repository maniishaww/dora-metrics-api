const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { deploymentCounter } = require('../monitoring/metrics');

router.post('/', (req, res) => {
  const { environment, status, lead_time_minutes, commit_hash } = req.body;

  if (!environment || !status) {
    return res.status(400).json({ 
      error: 'environment and status are required' 
    });
  }

  if (!['success', 'failure'].includes(status)) {
    return res.status(400).json({ 
      error: 'status must be success or failure' 
    });
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO deployments (id, timestamp, environment, status, lead_time_minutes, commit_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, timestamp, environment, status, lead_time_minutes || null, commit_hash || null);

  deploymentCounter.inc({ status, environment });

  return res.status(201).json({
    id,
    timestamp,
    environment,
    status,
    lead_time_minutes: lead_time_minutes || null,
    commit_hash: commit_hash || null
  });
});

router.get('/', (req, res) => {
  const deployments = db.prepare('SELECT * FROM deployments ORDER BY timestamp DESC').all();
  return res.json(deployments);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM deployments WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  db.prepare('DELETE FROM deployments WHERE id = ?').run(id);
  return res.json({ message: 'Deployment deleted' });
});

module.exports = router;