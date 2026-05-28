function getDeploymentFrequency(deployments) {
  if (!deployments || deployments.length === 0) {
    return { count: 0, period: 'day', rating: 'Low' };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const recent = deployments.filter(d => 
    new Date(d.timestamp) >= thirtyDaysAgo && d.status === 'success'
  );

  const perDay = recent.length / 30;

  let rating;
  if (perDay >= 1) rating = 'Elite';
  else if (perDay >= 1/7) rating = 'High';
  else if (perDay >= 1/30) rating = 'Medium';
  else rating = 'Low';

  return {
    count: recent.length,
    per_day: parseFloat(perDay.toFixed(3)),
    period: '30 days',
    rating
  };
}

function getLeadTime(deployments) {
  if (!deployments || deployments.length === 0) {
    return { average_minutes: 0, rating: 'Low' };
  }

  const withLeadTime = deployments.filter(d => 
    d.lead_time_minutes !== null && d.lead_time_minutes !== undefined
  );

  if (withLeadTime.length === 0) {
    return { average_minutes: 0, rating: 'Low' };
  }

  const avg = withLeadTime.reduce((sum, d) => 
    sum + d.lead_time_minutes, 0) / withLeadTime.length;

  let rating;
  if (avg < 60) rating = 'Elite';
  else if (avg < 1440) rating = 'High';
  else if (avg < 10080) rating = 'Medium';
  else rating = 'Low';

  return {
    average_minutes: parseFloat(avg.toFixed(2)),
    rating
  };
}

function getMTTR(incidents) {
  if (!incidents || incidents.length === 0) {
    return { average_minutes: 0, rating: 'Elite' };
  }

  const resolved = incidents.filter(i => i.resolved_at);

  if (resolved.length === 0) {
    return { average_minutes: 0, rating: 'Elite' };
  }

  const avg = resolved.reduce((sum, i) => {
    const start = new Date(i.started_at);
    const end = new Date(i.resolved_at);
    return sum + (end - start) / 60000;
  }, 0) / resolved.length;

  let rating;
  if (avg < 60) rating = 'Elite';
  else if (avg < 1440) rating = 'High';
  else if (avg < 10080) rating = 'Medium';
  else rating = 'Low';

  return {
    average_minutes: parseFloat(avg.toFixed(2)),
    rating
  };
}

function getChangeFailureRate(deployments) {
  if (!deployments || deployments.length === 0) {
    return { rate_percent: 0, rating: 'Elite' };
  }

  const total = deployments.length;
  const failures = deployments.filter(d => d.status === 'failure').length;
  const rate = (failures / total) * 100;

  let rating;
  if (rate <= 5) rating = 'Elite';
  else if (rate <= 10) rating = 'High';
  else if (rate <= 15) rating = 'Medium';
  else rating = 'Low';

  return {
    rate_percent: parseFloat(rate.toFixed(2)),
    total_deployments: total,
    failed_deployments: failures,
    rating
  };
}

function getOverallRating(ratings) {
  const order = ['Elite', 'High', 'Medium', 'Low'];
  const worst = ratings.reduce((acc, r) => {
    return order.indexOf(r) > order.indexOf(acc) ? r : acc;
  }, 'Elite');
  return worst;
}

module.exports = {
  getDeploymentFrequency,
  getLeadTime,
  getMTTR,
  getChangeFailureRate,
  getOverallRating
};