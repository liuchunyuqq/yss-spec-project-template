import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { missingChecks, readProjectDocument, validateDevelopmentGate } from './lib/development-gate.mjs';
import { resolveApplicableStandards } from './lib/applicable-standards.mjs';
import { fileDigest, contentDigest, evidenceKey } from './lib/acceptance-policy.mjs';
import { readRepositoryMode } from './lib/repository-mode.mjs';
import { checkJavaWebStyle } from './lib/java-web-style.mjs';
import { runCheck, captureBaseline } from './lib/execution-evidence.mjs';

test('MVC 身份支持可选 Profile，拒绝未知字段和越界路径', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mvc-identity-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = extra => writeFileSync(path.join(root, 'yss-project.yaml'), `schema_version: 1\nrepository_mode: project-instance\n${extra}`);
  put('governance_profile: docs/process/mvc-governance-profile.yaml\n');
  assert.equal(readRepositoryMode(root), 'project-instance');
  put(''); assert.equal(readRepositoryMode(root), 'project-instance');
  put('unknown: true\n'); assert.throws(() => readRepositoryMode(root));
  put('governance_profile: ../other.yaml\n'); assert.throws(() => readRepositoryMode(root));
});
test('无过程产物不能宣称完成', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-development.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checkpoint/);
});
test('成功但无关的命令及跳过测试不能覆盖登记命令', () => {
  assert.deepEqual(missingChecks(['mvnw package', 'mvnw fmt:check'], [{ command: 'mvnw -DskipTests package' }, { command: 'echo ok' }]), ['mvnw package', 'mvnw fmt:check']);
  assert.deepEqual(missingChecks(['mvnw package'], [{ command: 'mvnw package' }]), []);
});
test('空产物及越界引用失败', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mvc-artifact-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, 'empty.yaml'), ' \n');
  assert.throws(() => readProjectDocument(root, 'empty.yaml'), /空产物/);
  assert.throws(() => readProjectDocument(root, '../outside.yaml'), /非法/);
});
test('新 Controller 缺少文档和单行压缩会失败，规范示例通过', () => {
  const good = `/**
 * 查询接口。
 * @author Tester
 * @date 2026/09/08 17:00
 */
@RestController
public class QueryController {
  /**
   * 查询。
   * @author Tester
   * @date 2026/09/08 17:00
   * @param query 请求
   * @return 结果
   */
  @PostMapping("/query")
  public String query(String query) {
    return query;
  }
}`;
  assert.deepEqual(checkJavaWebStyle(good), []);
  assert.ok(checkJavaWebStyle(good.replace('* @param query 请求', '* 参数')).length);
  const annotated = good.replace('String query)', '@RequestParam(required = false) Map<String, Object> query)');
  assert.deepEqual(checkJavaWebStyle(annotated), []);
  assert.ok(checkJavaWebStyle(annotated.replace('* @param query 请求', '* 参数')).length);
  assert.ok(checkJavaWebStyle('@RestController public class Bad { public String send() { return "sent"; } }').length);
});

test('完整验收通过；缺少数据模型、合同检查、整体检查或独立审查会失败', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mvc-completion-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (ref, data) => { const file = path.join(root, ref); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data)); };
  put('yss-project.yaml', { schema_version: 1, repository_mode: 'project-instance' });
  put('CONTEXT.md', '# 上下文\n报送数据需要永久保存。');
  put('baseline.md', '# 基线\n使用实际测试。');
  put('spec.md', '# 验收\nAC-1：保存后重新查询获得相同数据。');
  put('model.md', '# 数据模型\nSubmission(id, managerCode, period)，业务唯一键为管理人和报表期。');
  put('service.java', 'class SubmissionService {}');
  put('docs/process/applicable-standards.yaml', { schema_version: 1, policy_id: 'applicable-standards-v1', repository_standards: [], impact_skills: {}, review_procedure_skills: [] });
  put('docs/process/implementation-repo-registry.yaml', { projects: [{ project_root: '.', verification_commands: ['mvnw package'] }] });
  mkdirSync(path.join(root, 'docs/process/schemas'), { recursive: true });
  copyFileSync('docs/process/schemas/lifecycle-checkpoint-v2.schema.json', path.join(root, 'docs/process/schemas/lifecycle-checkpoint-v2.schema.json'));
  const bundle = resolveApplicableStandards({ baseline_ref: 'baseline.md', context_refs: ['spec.md', 'model.md'], work_units: [{ id: 'save', required_skills: [], impacts: ['persistence-impact'] }] }, { projectRoot: root, skillRoot: path.join(root, '.agents/skills') });
  put('standards.json', bundle);
  const contract = { status: 'validated', contract_version: '1', acceptance_ids: ['AC-1'], allowed_write_paths: ['service.java'], required_checks: ['mvnw test'], artifacts: { spec: 'spec.md', data_model: 'model.md' }, resolution: { applicable_standards: bundle } };
  // 此夹具只测试门禁协议，声明能力的业务真实性由独立 Review 核实，不作为数据库验收证据。
  contract.required_checks = [`${process.execPath} --version`];
  contract.verification_plan = [{ id:'db', command:contract.required_checks[0], program:process.execPath, args:['--version'], environment:'fixture',input_paths:['service.java'], type:'database-integration', capabilities:['persistence','restart','transaction','non-mock-wiring'] }];
  contract.persistence_tasks = Object.fromEntries(['entity','mapper','database_implementation','transaction','storage'].map(k => [k, 'service.java']));
  contract.artifacts.requirements = 'requirements.json';
  put('requirements.json', {schema_version:1,acceptance_ids:['AC-1'],requirements:[{requirement_id:'REQ-1',source:{ref:'spec.md',digest:fileDigest('spec.md',root),location:'验收',kind:'body',excerpt:'保存后重新查询获得相同数据'},disposition:'in-scope',acceptance_ids:['AC-1'],rule_ids:[],scenario_ids:['SC-1']}],rules:[],scenarios:[{scenario_id:'SC-1',acceptance_ids:['AC-1'],given:'保存',when:'查询',then:'数据一致',check_ids:['db']}]});
  put('contract.json', contract);
  const inputs = { 'service.java': fileDigest('service.java', root) };
  const candidate = contentDigest(inputs);
  const baseline = fileDigest('baseline.md', root);
  const review = scope => ({ scope, candidate_digest: candidate, baseline_digest: baseline, inputs, reviewer: 'reviewer', implementers: ['worker'], result: 'pass', findings: [], acceptance_ids: ['AC-1'], standards_digest: bundle.digest, standards_digests: { save: bundle.digest } });
  put('slice-review.json', review('slice')); put('overall-review.json', review('overall'));
  const check = (command, ref) => { const evidence = { command, environment: 'fixture', inputs, exit_code: 0, executed_at: '2026-09-08T09:00:00Z' }; evidence.key = evidenceKey(evidence); put(ref, evidence); return { command, environment: evidence.environment, key: evidence.key, evidence_ref: ref }; };
  const state = { schema_version: 2, policy_id: 'acceptance-driven-v1', standards_context_version: 1, goal: '保存并查询报送记录', baseline_ref: 'baseline.md', baseline_digest: baseline, acceptance_ids: ['AC-1'], status: 'completed', blockers: [], slices: [{ id: 'save', status: 'completed', acceptance_ids: ['AC-1'], standards_ref: 'standards.json', standards_digest: bundle.digest, active_work_unit: 'save', contract_ref: 'contract.json', contract_version: '1', candidate_digest: candidate, review_ref: 'slice-review.json', checks: [check('mvnw test', 'test.json')] }], overall: { candidate_digest: candidate, review_ref: 'overall-review.json', checks: [check('mvnw package', 'package.json')] } };
  const reviewDefinition = scope => {
    const payload={actor_instance_id:'reviewer',implementer_instance_ids:['worker'],dispatch_id:'fixture-dispatch',candidate_digest:candidate,acceptance_ids:['AC-1'],findings:[],result:'pass'};
    const args=['-e',`console.log(${JSON.stringify(JSON.stringify(payload))})`];
    return {id:scope+'-review',type:'review',capabilities:['independent-review'],program:process.execPath,args,command:[process.execPath,...args].join(' '),environment:'fixture',input_paths:['service.java']};
  };
  contract.verification_plan.push(reviewDefinition('slice'));
  contract.required_checks=contract.verification_plan.map(c=>c.command); put('contract.json',contract);
  const asCheck=receipt=>({command:receipt.command,environment:receipt.environment,key:receipt.key,evidence_ref:receipt.evidence_ref});
  state.slices[0].checks=contract.verification_plan.map(c=>asCheck(runCheck(root,contract,c)));
  put('slice-review.json',{...review('slice'),execution_ref:state.slices[0].checks[1].evidence_ref});
  const packageCheck={...contract.verification_plan[0],id:'package',type:'unit',capabilities:['fixture']};
  state.overall.verification_plan=[packageCheck,reviewDefinition('overall')];
  const overallContract={allowed_write_paths:contract.allowed_write_paths,artifacts:contract.artifacts,required_checks:state.overall.verification_plan.map(c=>c.command),verification_plan:state.overall.verification_plan};
  put('docs/process/implementation-repo-registry.yaml',{projects:[{project_root:'.',verification_commands:overallContract.required_checks}]});
  state.overall.checks=overallContract.verification_plan.map(c=>asCheck(runCheck(root,overallContract,c)));
  put('overall-review.json',{...review('overall'),execution_ref:state.overall.checks[1].evidence_ref});
  state.overall.checkpoint_ref='checkpoint.json';
  state.overall.baseline_snapshot_ref=captureBaseline(root,['checkpoint.json','slice-review.json','overall-review.json']);
  assert.deepEqual(validateDevelopmentGate(root, state, 'completion'), []);
  // 原生子 agent 记录直接进入验收，不登记虚构的 Review 命令。
  contract.verification_plan=contract.verification_plan.filter(c=>c.type!=='review');
  contract.required_checks=contract.verification_plan.map(c=>c.command);
  put('contract.json',contract);
  state.slices[0].checks=contract.verification_plan.map(c=>asCheck(runCheck(root,contract,c)));
  state.overall.verification_plan=[packageCheck];
  overallContract.verification_plan=state.overall.verification_plan;
  overallContract.required_checks=[packageCheck.command];
  put('docs/process/implementation-repo-registry.yaml',{projects:[{project_root:'.',verification_commands:overallContract.required_checks}]});
  state.overall.checks=[asCheck(runCheck(root,overallContract,packageCheck))];
  for(const scope of ['slice','overall']) {
    const ref=`.yss/evidence/${scope}-subagent.json`;
    put(ref,{kind:'subagent-review',actor_instance_id:'reviewer',implementer_instance_ids:['worker'],dispatch_id:`fixture-${scope}`,candidate_digest:candidate,acceptance_ids:['AC-1'],findings:[],result:'pass',started_at:new Date().toISOString(),ended_at:new Date().toISOString()});
    put(`${scope}-review.json`,{...review(scope),execution_ref:ref});
  }
  state.overall.baseline_snapshot_ref=captureBaseline(root,['checkpoint.json','slice-review.json','overall-review.json']);
  assert.deepEqual(validateDevelopmentGate(root, state, 'completion'), []);
  put('spec.md', '# 验收\nAC-1：保存后重新查询获得相同数据。\nAC-2：重启后保留数据。');
  assert.match(validateDevelopmentGate(root,state,'completion').join('\n'),/Spec 验收未完整覆盖: AC-2/);
  put('spec.md', '# 验收\nAC-1：保存后重新查询获得相同数据。');
  const wrongId = structuredClone(state);
  wrongId.status = 'running';
  wrongId.acceptance_ids = ['AC-01'];
  assert.match(validateDevelopmentGate(root, wrongId, 'implementation').join('\n'), /验收.*精确|精确.*验收/);
  contract.allowed_write_paths = ['wrong-project-core/src']; put('contract.json', contract);
  assert.match(validateDevelopmentGate(root, state, 'implementation').join('\n'), /路径.*模块|模块.*路径/);
  contract.allowed_write_paths = ['service.java']; put('contract.json', contract);
  delete contract.artifacts.data_model; put('contract.json', contract);
  assert.match(validateDevelopmentGate(root, state, 'implementation').join('\n'), /data_model/);
  contract.artifacts.data_model = 'model.md'; put('contract.json', contract);
  const incomplete = structuredClone(state); incomplete.slices[0].checks = [];
  assert.match(validateDevelopmentGate(root, incomplete, 'completion').join('\n'), /必需检查/);
  incomplete.slices[0].checks = state.slices[0].checks; incomplete.overall.checks = [];
  assert.match(validateDevelopmentGate(root, incomplete, 'completion').join('\n'), /整体缺少/);
  put('slice-review.json', { ...review('slice'), reviewer: 'worker' });
  assert.match(validateDevelopmentGate(root, state, 'completion').join('\n'), /independent-review/);
});
