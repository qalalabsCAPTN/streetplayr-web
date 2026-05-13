export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startedAt: number;
  durationMs: number;
  status: 'ok' | 'error' | 'timeout';
  tags?: Record<string, string>;
  error?: string;
}

export interface EventTrace {
  traceId: string;
  correlationId: string;
  eventId: string;
  eventType: string;
  userId: string;
  platform: string;
  totalDurationMs: number;
  status: 'completed' | 'failed' | 'partial';
  spans: TraceSpan[];
  startedAt: string;
}

export interface QueueMetric {
  name: string;
  displayName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  processingRate: number;
}

export interface WorkerHealth {
  workerId: string;
  queue: string;
  status: 'idle' | 'processing' | 'stalled' | 'offline';
  jobsProcessed: number;
  jobsFailed: number;
  avgProcessingMs: number;
  lastHeartbeat: string;
  cpuPct: number;
  memoryMb: number;
}

export const DEMO_TRACES: EventTrace[] = [
  {
    traceId: 'trc_e1f2a3b4',
    correlationId: 'cor_x9y8z7',
    eventId: 'evt_001',
    eventType: 'order.completed',
    userId: 'usr_rahul_001',
    platform: 'streetplayr',
    totalDurationMs: 287,
    status: 'completed',
    startedAt: '2026-05-13T12:04:33.120Z',
    spans: [
      { spanId: 's1', service: 'api', operation: 'POST /v1/events', startedAt: 0, durationMs: 18, status: 'ok', tags: { http_status: '202' } },
      { spanId: 's2', parentSpanId: 's1', service: 'api', operation: 'validateEnvelope', startedAt: 2, durationMs: 4, status: 'ok' },
      { spanId: 's3', parentSpanId: 's1', service: 'api', operation: 'verifyHmac', startedAt: 6, durationMs: 3, status: 'ok' },
      { spanId: 's4', parentSpanId: 's1', service: 'api', operation: 'persistEvent', startedAt: 9, durationMs: 8, status: 'ok', tags: { db: 'supabase' } },
      { spanId: 's5', parentSpanId: 's1', service: 'api', operation: 'enqueueJob', startedAt: 17, durationMs: 1, status: 'ok', tags: { queue: 'nectar:event-processing' } },
      { spanId: 's6', service: 'worker', operation: 'event-processor.pick', startedAt: 45, durationMs: 3, status: 'ok' },
      { spanId: 's7', parentSpanId: 's6', service: 'worker', operation: 'RewardEngine.processEvent', startedAt: 48, durationMs: 180, status: 'ok' },
      { spanId: 's8', parentSpanId: 's7', service: 'worker', operation: 'findMatchingRules', startedAt: 50, durationMs: 22, status: 'ok', tags: { rules_found: '3' } },
      { spanId: 's9', parentSpanId: 's7', service: 'worker', operation: 'ValidationPipeline.run', startedAt: 72, durationMs: 38, status: 'ok', tags: { validators: '7', passed: 'true' } },
      { spanId: 's10', parentSpanId: 's7', service: 'worker', operation: 'applyTierMultiplier', startedAt: 110, durationMs: 5, status: 'ok', tags: { tier: 'bloom', multiplier: '1.25' } },
      { spanId: 's11', parentSpanId: 's7', service: 'worker', operation: 'LedgerRepository.append', startedAt: 115, durationMs: 62, status: 'ok', tags: { points: '1875', wallet: 'wlt_001' } },
      { spanId: 's12', parentSpanId: 's7', service: 'worker', operation: 'grantXp', startedAt: 177, durationMs: 41, status: 'ok', tags: { xp: '500' } },
      { spanId: 's13', parentSpanId: 's7', service: 'worker', operation: 'markEventProcessed', startedAt: 218, durationMs: 12, status: 'ok' },
      { spanId: 's14', service: 'worker', operation: 'realtime.broadcast', startedAt: 230, durationMs: 57, status: 'ok', tags: { channel: 'user:usr_rahul_001' } },
    ],
  },
  {
    traceId: 'trc_f2e3d4c5',
    correlationId: 'cor_a1b2c3',
    eventId: 'evt_002',
    eventType: 'referral.converted',
    userId: 'usr_priya_002',
    platform: 'playr',
    totalDurationMs: 184,
    status: 'completed',
    startedAt: '2026-05-13T12:03:11.450Z',
    spans: [
      { spanId: 's1', service: 'api', operation: 'POST /v1/events', startedAt: 0, durationMs: 21, status: 'ok' },
      { spanId: 's2', parentSpanId: 's1', service: 'api', operation: 'validateEnvelope', startedAt: 2, durationMs: 5, status: 'ok' },
      { spanId: 's3', parentSpanId: 's1', service: 'api', operation: 'verifyHmac', startedAt: 7, durationMs: 3, status: 'ok' },
      { spanId: 's4', parentSpanId: 's1', service: 'api', operation: 'persistEvent', startedAt: 10, durationMs: 10, status: 'ok' },
      { spanId: 's5', service: 'worker', operation: 'event-processor.pick', startedAt: 52, durationMs: 4, status: 'ok' },
      { spanId: 's6', parentSpanId: 's5', service: 'worker', operation: 'RewardEngine.processEvent', startedAt: 56, durationMs: 110, status: 'ok' },
      { spanId: 's7', parentSpanId: 's6', service: 'worker', operation: 'ReferralService.process', startedAt: 60, durationMs: 45, status: 'ok' },
      { spanId: 's8', parentSpanId: 's6', service: 'worker', operation: 'LedgerRepository.append (×2)', startedAt: 105, durationMs: 61, status: 'ok', tags: { referrer_points: '2000', referee_points: '1500' } },
    ],
  },
  {
    traceId: 'trc_a9b8c7d6',
    correlationId: 'cor_q4r5s6',
    eventId: 'evt_003',
    eventType: 'order.completed',
    userId: 'usr_alpha_001',
    platform: 'streetplayr',
    totalDurationMs: 412,
    status: 'failed',
    startedAt: '2026-05-13T08:14:19.000Z',
    spans: [
      { spanId: 's1', service: 'api', operation: 'POST /v1/events', startedAt: 0, durationMs: 19, status: 'ok' },
      { spanId: 's2', parentSpanId: 's1', service: 'api', operation: 'validateEnvelope', startedAt: 2, durationMs: 4, status: 'ok' },
      { spanId: 's3', parentSpanId: 's1', service: 'api', operation: 'verifyHmac', startedAt: 6, durationMs: 3, status: 'ok' },
      { spanId: 's4', service: 'worker', operation: 'event-processor.pick', startedAt: 48, durationMs: 3, status: 'ok' },
      { spanId: 's5', parentSpanId: 's4', service: 'worker', operation: 'RewardEngine.processEvent', startedAt: 51, durationMs: 300, status: 'ok' },
      { spanId: 's6', parentSpanId: 's5', service: 'worker', operation: 'ValidationPipeline.run', startedAt: 55, durationMs: 38, status: 'ok' },
      { spanId: 's7', parentSpanId: 's5', service: 'worker', operation: 'RiskEngine.evaluate', startedAt: 93, durationMs: 88, status: 'error', error: 'VELOCITY_BREACH: 9.6× threshold exceeded. Score: 94/100. Auto-block enforced.', tags: { score: '94', threshold: '90' } },
      { spanId: 's8', parentSpanId: 's5', service: 'worker', operation: 'BlocklistValidator.check', startedAt: 181, durationMs: 12, status: 'error', error: 'User flagged: velocity_points (auto-block)' },
      { spanId: 's9', service: 'worker', operation: 'dead-letter.enqueue', startedAt: 350, durationMs: 8, status: 'ok', tags: { reason: 'risk_block' } },
    ],
  },
];

export const DEMO_QUEUE_METRICS: QueueMetric[] = [
  { name: 'nectar:event-processing', displayName: 'Event Processing', waiting: 24, active: 8, completed: 184320, failed: 127, delayed: 3, paused: false, processingRate: 340 },
  { name: 'nectar:reward-execution', displayName: 'Reward Execution', waiting: 11, active: 4, completed: 92840, failed: 43, delayed: 0, paused: false, processingRate: 180 },
  { name: 'nectar:progression', displayName: 'Progression', waiting: 6, active: 2, completed: 71230, failed: 12, delayed: 0, paused: false, processingRate: 95 },
  { name: 'nectar:referral', displayName: 'Referral', waiting: 2, active: 1, completed: 18420, failed: 8, delayed: 0, paused: false, processingRate: 22 },
  { name: 'nectar:realtime', displayName: 'Realtime', waiting: 44, active: 12, completed: 210480, failed: 31, delayed: 0, paused: false, processingRate: 520 },
  { name: 'nectar:dead-letter', displayName: 'Dead Letter', waiting: 89, active: 0, completed: 0, failed: 0, delayed: 0, paused: true, processingRate: 0 },
];

export const DEMO_WORKER_HEALTH: WorkerHealth[] = [
  { workerId: 'wkr-event-1', queue: 'nectar:event-processing', status: 'processing', jobsProcessed: 48210, jobsFailed: 31, avgProcessingMs: 243, lastHeartbeat: '2026-05-13T12:04:58Z', cpuPct: 42, memoryMb: 284 },
  { workerId: 'wkr-event-2', queue: 'nectar:event-processing', status: 'processing', jobsProcessed: 46840, jobsFailed: 28, avgProcessingMs: 251, lastHeartbeat: '2026-05-13T12:04:59Z', cpuPct: 38, memoryMb: 271 },
  { workerId: 'wkr-event-3', queue: 'nectar:event-processing', status: 'processing', jobsProcessed: 44110, jobsFailed: 22, avgProcessingMs: 238, lastHeartbeat: '2026-05-13T12:04:57Z', cpuPct: 45, memoryMb: 296 },
  { workerId: 'wkr-event-4', queue: 'nectar:event-processing', status: 'idle', jobsProcessed: 45160, jobsFailed: 46, avgProcessingMs: 261, lastHeartbeat: '2026-05-13T12:04:59Z', cpuPct: 2, memoryMb: 248 },
  { workerId: 'wkr-reward-1', queue: 'nectar:reward-execution', status: 'processing', jobsProcessed: 46820, jobsFailed: 21, avgProcessingMs: 318, lastHeartbeat: '2026-05-13T12:04:58Z', cpuPct: 31, memoryMb: 312 },
  { workerId: 'wkr-reward-2', queue: 'nectar:reward-execution', status: 'processing', jobsProcessed: 46020, jobsFailed: 22, avgProcessingMs: 322, lastHeartbeat: '2026-05-13T12:04:59Z', cpuPct: 29, memoryMb: 308 },
  { workerId: 'wkr-prog-1', queue: 'nectar:progression', status: 'idle', jobsProcessed: 35840, jobsFailed: 6, avgProcessingMs: 198, lastHeartbeat: '2026-05-13T12:04:55Z', cpuPct: 3, memoryMb: 220 },
  { workerId: 'wkr-realtime-1', queue: 'nectar:realtime', status: 'processing', jobsProcessed: 70820, jobsFailed: 11, avgProcessingMs: 88, lastHeartbeat: '2026-05-13T12:04:59Z', cpuPct: 18, memoryMb: 188 },
  { workerId: 'wkr-realtime-2', queue: 'nectar:realtime', status: 'processing', jobsProcessed: 69910, jobsFailed: 10, avgProcessingMs: 91, lastHeartbeat: '2026-05-13T12:04:59Z', cpuPct: 19, memoryMb: 190 },
  { workerId: 'wkr-realtime-3', queue: 'nectar:realtime', status: 'stalled', jobsProcessed: 69750, jobsFailed: 10, avgProcessingMs: 92, lastHeartbeat: '2026-05-13T12:02:31Z', cpuPct: 0, memoryMb: 0 },
];

export const DEMO_LATENCY_SERIES = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  p50: 180 + Math.floor(Math.random() * 60),
  p95: 320 + Math.floor(Math.random() * 140),
  p99: 480 + Math.floor(Math.random() * 200),
  errorRate: Math.random() * 0.8,
}));
