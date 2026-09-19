export default async function handler(req, res) {
  const rawCount = Number(req.query?.count ?? 5);
  const count = Number.isFinite(rawCount) ? Math.max(2, Math.min(10, Math.floor(rawCount))) : 5;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const base = `${proto}://${host}`;
  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const tasks = Array.from({ length: count }, (_, i) => (async () => {
    const startedMs = Date.now();
    const startedAt = new Date(startedMs).toISOString();
    try {
      const response = await fetch(`${base}/api/runtime?batch=${encodeURIComponent(batchId)}&slot=${i}&nonce=${Date.now()}-${Math.random()}`, {
        method: 'GET',
        headers: { 'cache-control': 'no-store' },
        cache: 'no-store'
      });
      const body = await response.json();
      const endedMs = Date.now();
      return {
        slot: i,
        http_status: response.status,
        started_at: startedAt,
        ended_at: new Date(endedMs).toISOString(),
        duration_ms: endedMs - startedMs,
        runtime_status: body.status ?? null,
        pass: body.conformance?.pass ?? null,
        fail: body.conformance?.fail ?? null,
        signed_valid: body.signed?.valid ?? null,
        execution_id: body.observed?.execution_id ?? null,
        manifest_hash: body.signed?.manifest_hash ?? null
      };
    } catch (error) {
      const endedMs = Date.now();
      return {
        slot: i,
        http_status: null,
        started_at: startedAt,
        ended_at: new Date(endedMs).toISOString(),
        duration_ms: endedMs - startedMs,
        error: String(error?.message || error),
        runtime_status: null,
        pass: null,
        fail: null,
        signed_valid: false,
        execution_id: null,
        manifest_hash: null
      };
    }
  })());

  const results = await Promise.all(tasks);
  const ids = results.map(r => r.execution_id).filter(Boolean);
  const hashes = results.map(r => r.manifest_hash).filter(Boolean);
  const allPass = results.every(r => r.http_status === 200 && r.runtime_status === 'OBSERVED' && r.pass === 112 && r.fail === 0 && r.signed_valid === true);
  const uniqueExecutionIds = new Set(ids).size === count;
  const uniqueManifestHashes = new Set(hashes).size === count;

  const intervals = results
    .filter(r => r.started_at && r.ended_at)
    .map(r => [Date.parse(r.started_at), Date.parse(r.ended_at)]);
  let maxOverlap = 0;
  for (const [s] of intervals) {
    let overlap = 0;
    for (const [s2, e2] of intervals) if (s2 <= s && e2 >= s) overlap++;
    if (overlap > maxOverlap) maxOverlap = overlap;
  }

  res.status(allPass ? 200 : 503).json({
    system: 'ARIS-9.6 ULTIMATE concurrency test',
    batch_id: batchId,
    requested: count,
    completed: results.length,
    parallel_dispatch: true,
    max_observed_overlap: maxOverlap,
    concurrent_overlap_observed: maxOverlap >= 2,
    all_runtime_checks_pass: allPass,
    unique_execution_ids: uniqueExecutionIds,
    unique_manifest_hashes: uniqueManifestHashes,
    results,
    epistemic_boundary: 'This endpoint verifies bounded concurrent HTTP execution behavior only; it does not prove universal correctness, host-wide scheduler guarantees, or release authority.'
  });
}
