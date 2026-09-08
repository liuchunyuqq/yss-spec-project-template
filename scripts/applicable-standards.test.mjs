import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveApplicableStandards, verifyApplicableStandards, contextForWorkUnit } from './lib/applicable-standards.mjs';
import { compileImplementationContract, evaluateContractFreshness } from './lib/implementation-contract-compiler.mjs';

function fixture(t) {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'standards-'));
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
  const skillRoot = path.join(projectRoot, 'skills');
  const put = (ref, text) => { const p = path.join(projectRoot, ref); mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, text); };
  put('docs/process/applicable-standards.yaml', readFileSync(new URL('../docs/process/applicable-standards.yaml', import.meta.url)));
  put('yss-project.yaml', 'repository_mode: project-instance\ngovernance_profile: profile.yaml\n');
  put('profile.yaml', 'runtime_scope: backend-only\ndomain_driven_design: {status: not-applicable}\nlifecycle: {routing: {forbidden_skills: [yss-domain, yss-ui]}}\n');
  put('CONTEXT.md', '业务术语'); put('baseline.md', '工程质量基线');
  for (const name of ['yss-web-controller', 'yss-dto', 'yss-repository', 'yss-mybatis', 'yss-backend-runtime-verification', 'alibaba-java-code-style']) put(`skills/${name}/SKILL.md`, `${name} 的规范`);
  const request = { baseline_ref: 'baseline.md', work_units: [{ id: 'http', required_skills: ['yss-web-controller'], impacts: ['web-adapter-impact', 'backend_impact'] }, { id: 'query', required_skills: ['yss-mybatis'], impacts: ['persistence-impact'] }] };
  return { roots: { projectRoot, skillRoot }, request, put };
}
test('实现和 Review 共用结果；HTTP 与查询工作单元只加载各自规范', t => {
  const f = fixture(t); const bundle = resolveApplicableStandards(f.request, f.roots);
  assert.deepEqual(resolveApplicableStandards(f.request, f.roots), bundle);
  const http = contextForWorkUnit(bundle, 'http', f.roots);
  assert(http.required_context_refs.includes('skills:yss-dto/SKILL.md'));
  assert(!http.required_context_refs.includes('skills:yss-mybatis/SKILL.md'));
  assert(!bundle.sources.some(s => /yss-domain|yss-ui|code-review/.test(s.ref)));
  assert.throws(() => contextForWorkUnit(bundle, 'unknown', f.roots), /未登记/);
});
test('运行时影响在实现前补充专项标准；审查操作不进入实现上下文', t => {
  const f = fixture(t); f.request.work_units[0].impacts.push('mapper-registration-impact');
  f.request.work_units[0].required_skills.push('code-review');
  const bundle = resolveApplicableStandards(f.request, f.roots);
  assert(bundle.sources.some(s => s.ref === 'skills:yss-backend-runtime-verification/SKILL.md'));
  assert(!bundle.sources.some(s => /code-review/.test(s.ref)));
});
test('恢复时检查相关正文、reference 与新增仓库规范；无关文件不使摘要失效', t => {
  const f = fixture(t);
  f.put('skills/yss-web-controller/SKILL.md', '[细则](references/http.md)');
  f.put('skills/yss-web-controller/references/http.md', 'HTTP 规则');
  const bundle = resolveApplicableStandards(f.request, f.roots);
  assert(contextForWorkUnit(bundle, 'http', f.roots).on_demand_context_refs.includes('skills:yss-web-controller/references/http.md'));
  f.put('unrelated.md', '无关'); assert.equal(verifyApplicableStandards(bundle, f.roots).freshness, 'current');
  f.put('skills/yss-web-controller/references/http.md', '新规则');
  assert.throws(() => contextForWorkUnit(bundle, 'http', f.roots), /changed/);
  const refreshed = resolveApplicableStandards(f.request, f.roots);
  f.put('CODING_STANDARDS.md', '新增工程规范');
  assert.equal(verifyApplicableStandards(refreshed, f.roots).freshness, 'stale');
});

test('解析跨技能引用与 YAML 规范而不误判为本技能文件', t => {
  const f=fixture(t);
  f.put('skills/yss-dto/SKILL.md','读取 `yss-mybatis/references/query.md` 与 `references/wire.yaml`。');
  f.put('skills/yss-mybatis/references/query.md','查询约定');
  f.put('skills/yss-dto/references/wire.yaml','wrapper: Result');
  const bundle=resolveApplicableStandards(f.request,f.roots);
  assert(bundle.sources.some(s=>s.ref==='skills:yss-mybatis/references/query.md'));
  f.put('skills/yss-dto/references/wire.yaml','wrapper: Changed');
  assert.equal(verifyApplicableStandards(bundle,f.roots).freshness,'stale');
});
test('拒绝缺失、越界、伪造摘要和 MVC 禁止的技能', t => {
  const f = fixture(t); const bundle = resolveApplicableStandards(f.request, f.roots);
  bundle.sources.pop(); assert.equal(verifyApplicableStandards(bundle, f.roots).freshness, 'stale');
  f.request.baseline_ref = '../outside'; assert.throws(() => resolveApplicableStandards(f.request, f.roots), /非法/);
  f.request.baseline_ref = 'missing.md'; assert.throws(() => resolveApplicableStandards(f.request, f.roots), /ENOENT/);
  f.request.baseline_ref = 'baseline.md'; f.request.work_units[0].required_skills.push('yss-domain');
  assert.throws(() => resolveApplicableStandards(f.request, f.roots), /禁止/);
});

test('完整编译器冻结规范；缺少闭包覆盖或正文变化不能沿用合同', t => {
  const f=fixture(t);
  const registry={schema_version:2,skills:[{id:'yss-web-controller'}],capabilities:[{id:'http',primary_skill:'yss-web-controller'}],recipes:[]};
  const compilerContract={schema_version:2};
  const input={registry,compilerContract,requiredCapabilities:['http'],standardsRequest:f.request,standardsRoots:f.roots};
  const result=compileImplementationContract(input);
  assert(result.applicable_standards.sources.some(s=>s.ref==='skills:yss-dto/SKILL.md'));
  assert.deepEqual(result.context_plan,result.applicable_standards.context_plan);
  const current={registry,compilerContract,standardsRoots:f.roots};
  assert.equal(evaluateContractFreshness(result,current).freshness,'current');
  f.put('skills/yss-dto/SKILL.md','修改 wire 规则');
  assert.equal(evaluateContractFreshness(result,current).freshness,'stale');
  f.request.work_units[0].required_skills=[];
  assert.throws(()=>compileImplementationContract(input),/未覆盖/);
});
