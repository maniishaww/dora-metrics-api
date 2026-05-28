const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const deploymentCounter = new client.Counter({
  name: 'dora_deployments_total',
  help: 'Total number of deployments logged',
  labelNames: ['status', 'environment'],
  registers: [register]
});

const incidentCounter = new client.Counter({
  name: 'dora_incidents_total',
  help: 'Total number of incidents logged',
  labelNames: ['severity'],
  registers: [register]
});

const leadTimeGauge = new client.Gauge({
  name: 'dora_lead_time_minutes',
  help: 'Average lead time for changes in minutes',
  registers: [register]
});

const mttrGauge = new client.Gauge({
  name: 'dora_mttr_minutes',
  help: 'Mean time to recovery in minutes',
  registers: [register]
});

const failureRateGauge = new client.Gauge({
  name: 'dora_change_failure_rate_percent',
  help: 'Change failure rate as a percentage',
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register]
});

module.exports = {
  register,
  deploymentCounter,
  incidentCounter,
  leadTimeGauge,
  mttrGauge,
  failureRateGauge,
  httpRequestDuration
};