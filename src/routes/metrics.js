const express = require('express');
const router = express.Router();
const db = require('../database');
const {
  getDeploymentFrequency,
  getLeadTime,
  getMTTR,
  getChangeFailureRate,
  getOverallRating
} = require('../calculations/dora');
const {
  leadTimeGauge,
  mttrGauge,
  failureRateGauge
} = require('../monitoring/metrics');

router.get('/frequency', (req, res) => {
  const deployments = db.prepare('SELECT * FROM deployments').all();
  const result = getDeploymentFrequency(deployments);
  return res.json(result);
});

router.get('/lead-time', (req, res) => {
  const deployments = db.prepare('SELECT * FROM deployments').all();
  const result = getLeadTime(deployments);
  leadTimeGauge.set(result.average_minutes);
  return res.json(result);
});

router.get('/mttr', (req, res) => {
  const incidents = db.prepare('SELECT * FROM incidents').all();
  const result = getMTTR(incidents);
  mttrGauge.set(result.average_minutes);
  return res.json(result);
});

router.get('/failure-rate', (req, res) => {
  const deployments = db.prepare('SELECT * FROM deployments').all();
  const result = getChangeFailureRate(deployments);
  failureRateGauge.set(result.rate_percent);
  return res.json(result);
});

router.get('/rating', (req, res) => {
  const deployments = db.prepare('SELECT * FROM deployments').all();
  const incidents = db.prepare('SELECT * FROM incidents').all();

  const frequency = getDeploymentFrequency(deployments);
  const leadTime = getLeadTime(deployments);
  const mttr = getMTTR(incidents);
  const failureRate = getChangeFailureRate(deployments);

  const overall = getOverallRating([
    frequency.rating,
    leadTime.rating,
    mttr.rating,
    failureRate.rating
  ]);

  return res.json({
    overall_rating: overall,
    breakdown: {
      deployment_frequency: frequency.rating,
      lead_time: leadTime.rating,
      mttr: mttr.rating,
      change_failure_rate: failureRate.rating
    }
  });
});

module.exports = router;