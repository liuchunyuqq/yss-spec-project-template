import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDevelopmentAction, evidenceKey, contentDigest, validateAcceptanceCheckpoint } from './lib/acceptance-policy.mjs';
import { validateImplementationEntry } from './lib/lifecycle-transition.mjs';

test('明确需求、改名、修复和范围内新依赖均自主推进，真实歧义才提问', () => {
  assert.equal(selectDevelopmentAction({}), 'orchestrate');
  assert.equal(selectDevelopmentAction({ change: 'rename' }), 'orchestrate');
  assert.equal(selectDevelopmentAction({ violation: true }), 'repair');
  assert.equal(selectDevelopmentAction({ stale: true }), 'refresh-inputs');
  assert.equal(selectDevelopmentAction({ new_impacts: ['dependency'], within_goal: true }), 'update-plan');
  assert.equal(selectDevelopmentAction({ new_impacts: ['unknown'] }), 'assess-scope');
  assert.equal(selectDevelopmentAction({ input_reason: 'business-ambiguity' }), 'awaiting-input');
  assert.equal(selectDevelopmentAction({ input_reason: 'variable-rename' }), 'diagnose');
  assert.equal(selectDevelopmentAction({ read_only: true }), 'route');
});
test('validated 当前切片无需批准即可进入实现，过期与路径缺失不得进入', () => {
  const state = { schema_version: 2, policy_id: 'acceptance-driven-v1', slice_contract: { status: 'validated', current_version: true, persisted: true, ticket_ref: 'slice.md', acceptance_ids: ['AC-1'], allowed_write_paths: ['server/'] } };
  const options = { exists: ref => ref === 'slice.md' };
  assert.equal(validateImplementationEntry(state, options).result, 'allowed');
  assert.equal(validateImplementationEntry({ ...state, stale: true }, options).result, 'blocked');
  assert.equal(validateImplementationEntry({ ...state, stale_inputs: ['openapi'] }, options).result, 'blocked');
  assert.equal(validateImplementationEntry({ ...state, slice_contract: { ...state.slice_contract, allowed_write_paths: [] } }, options).result, 'blocked');
});
function fixture() {
  const inputs = { 'server/Query.java': 'current' };
  const evidence = { inputs, command: 'mvnw package', environment: 'jdk8-fixture', exit_code: 0, executed_at: '2026-09-07T00:00:00Z' };
  evidence.key = evidenceKey(evidence);
  const digest = contentDigest(inputs);
  const review = { inputs, scope: 'slice', baseline_digest: 'baseline', candidate_digest: digest, reviewer: 'reviewer-1', implementers: ['worker-1'], result: 'pass', acceptance_ids: ['AC-1'], findings: [] };
  const refs = { 'slice-review': review, 'overall-review': { ...review, scope: 'overall' }, verification: evidence };
  const item = { candidate_digest: digest, checks: [{ evidence_ref: 'verification', key: evidence.key, command: evidence.command, environment: evidence.environment }] };
  const state = { schema_version: 2, policy_id: 'acceptance-driven-v1', goal: '查询', baseline_ref: 'baseline.md', baseline_digest: 'baseline', acceptance_ids: ['AC-1'], status: 'completed', blockers: [], slices: [{ ...item, id: 'slice-1', status: 'completed', acceptance_ids: ['AC-1'], review_ref: 'slice-review' }], overall: { ...item, review_ref: 'overall-review' } };
  const options = { resolve: ref => { if (!refs[ref]) throw Error('missing'); return refs[ref]; }, digest: ref => ref === 'baseline.md' ? 'baseline' : inputs[ref] ?? null };
  return { state, options, refs };
}
test('切片与整体审查、集成检查和需求覆盖均通过才完成', () => {
  const { state, options } = fixture();
  assert.deepEqual(validateAcceptanceCheckpoint(state, options), []);
  delete state.overall;
  assert(validateAcceptanceCheckpoint(state, options).includes('overall-review-unreadable'));
});
test('非零退出码、同一实施审查者、整体集成缺陷和遗漏需求被拒绝', () => {
  for (const mutate of [
    f => { f.refs.verification.exit_code = 1; },
    f => { f.refs['slice-review'].reviewer = 'worker-1'; },
    f => { f.refs['overall-review'].findings = [{ kind: 'defect', status: 'open' }]; },
    f => { f.state.acceptance_ids.push('AC-2'); },
    f => { f.state.slices[0].checks = []; },
  ]) {
    const f = fixture(); mutate(f); assert(validateAcceptanceCheckpoint(f.state, f.options).length > 0);
  }
});
test('无关文件不影响证据，相关代码变化或环境变化拒绝旧证据', () => {
  const f = fixture();
  assert.deepEqual(validateAcceptanceCheckpoint(f.state, f.options), []);
  assert.equal(evidenceKey({ inputs: { a: '1', b: '2' }, command: 'test', environment: 'env' }), evidenceKey({ inputs: { b: '2', a: '1' }, command: 'test', environment: 'env' }));
  f.options.digest = ref => ref === 'baseline.md' ? 'baseline' : 'changed';
  assert(validateAcceptanceCheckpoint(f.state, f.options).includes('slice-candidate-changed'));
  const g = fixture(); g.state.slices[0].checks[0].environment = 'jdk-other';
  assert(validateAcceptanceCheckpoint(g.state, g.options).includes('slice-verification-context-changed'));
});
test('整体验收列表不能被局部字段覆盖，基线变化必须重新审查', () => {
  const f = fixture(); f.state.overall.acceptance_ids = []; f.refs['overall-review'].acceptance_ids = [];
  assert(validateAcceptanceCheckpoint(f.state, f.options).includes('overall-acceptance-not-reviewed'));
  const g = fixture(); const original = g.options.digest;
  g.options.digest = ref => ref === 'baseline.md' ? 'changed-baseline' : original(ref);
  assert(validateAcceptanceCheckpoint(g.state, g.options).includes('baseline-changed'));
  g.state.baseline_digest = 'changed-baseline';
  assert(validateAcceptanceCheckpoint(g.state, g.options).includes('overall-baseline-not-reviewed'));
});
