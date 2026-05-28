const {
  getDeploymentFrequency,
  getLeadTime,
  getMTTR,
  getChangeFailureRate,
  getOverallRating
} = require('../src/calculations/dora');

describe('Deployment Frequency', () => {
  test('returns Low rating when no deployments', () => {
    const result = getDeploymentFrequency([]);
    expect(result.rating).toBe('Low');
    expect(result.count).toBe(0);
  });

  test('returns Elite rating when deploying multiple times per day', () => {
    const deployments = Array.from({ length: 60 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
      status: 'success'
    }));
    const result = getDeploymentFrequency(deployments);
    expect(result.rating).toBe('Elite');
  });

  test('only counts successful deployments', () => {
    const deployments = [
      { timestamp: new Date().toISOString(), status: 'failure' },
      { timestamp: new Date().toISOString(), status: 'failure' }
    ];
    const result = getDeploymentFrequency(deployments);
    expect(result.count).toBe(0);
  });

  test('only counts deployments within last 30 days', () => {
    const deployments = [
      { timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), status: 'success' }
    ];
    const result = getDeploymentFrequency(deployments);
    expect(result.count).toBe(0);
  });
});

describe('Lead Time', () => {
  test('returns Low rating when no deployments', () => {
    const result = getLeadTime([]);
    expect(result.rating).toBe('Low');
  });

  test('returns Elite rating for lead time under 60 minutes', () => {
    const result = getLeadTime([{ lead_time_minutes: 30 }]);
    expect(result.rating).toBe('Elite');
    expect(result.average_minutes).toBe(30);
  });

  test('returns High rating for lead time under 24 hours', () => {
    const result = getLeadTime([{ lead_time_minutes: 500 }]);
    expect(result.rating).toBe('High');
  });

  test('calculates average correctly across multiple deployments', () => {
    const result = getLeadTime([
      { lead_time_minutes: 30 },
      { lead_time_minutes: 90 }
    ]);
    expect(result.average_minutes).toBe(60);
  });
});

describe('MTTR', () => {
  test('returns Elite when no incidents', () => {
    const result = getMTTR([]);
    expect(result.rating).toBe('Elite');
  });

  test('returns Elite for recovery under 60 minutes', () => {
    const start = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const end = new Date().toISOString();
    const result = getMTTR([{ started_at: start, resolved_at: end }]);
    expect(result.rating).toBe('Elite');
  });

  test('ignores unresolved incidents', () => {
    const result = getMTTR([{ started_at: new Date().toISOString(), resolved_at: null }]);
    expect(result.average_minutes).toBe(0);
  });
});

describe('Change Failure Rate', () => {
  test('returns Elite when no deployments', () => {
    const result = getChangeFailureRate([]);
    expect(result.rating).toBe('Elite');
  });

test('returns Elite when failure rate is under 5 percent', () => {
    const deployments = [
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'success' },
      { status: 'success' }, { status: 'failure' }
    ];
    const result = getChangeFailureRate(deployments);
    expect(result.rating).toBe('Elite');
    expect(result.rate_percent).toBe(5);
  });

  test('correctly counts failures', () => {
    const deployments = [
      { status: 'failure' },
      { status: 'failure' },
      { status: 'success' }
    ];
    const result = getChangeFailureRate(deployments);
    expect(result.failed_deployments).toBe(2);
    expect(result.total_deployments).toBe(3);
  });
});

describe('Overall Rating', () => {
  test('returns worst rating among all metrics', () => {
    const result = getOverallRating(['Elite', 'High', 'Low', 'Medium']);
    expect(result).toBe('Low');
  });

  test('returns Elite when all metrics are Elite', () => {
    const result = getOverallRating(['Elite', 'Elite', 'Elite', 'Elite']);
    expect(result).toBe('Elite');
  });
});