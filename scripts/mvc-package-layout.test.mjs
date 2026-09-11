import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkMvcStructure, parseJavaProject } from './lib/mvc-structure.mjs';
import { loadPackageLayout, validateLayoutPlan, checkPackageLayout, changedJavaFiles, hashLayout, mergeLayoutTypes, identifyRoles } from './lib/mvc-package-layout.mjs';
import { resolveApplicableStandards, contextForWorkUnit, verifyApplicableStandards } from './lib/applicable-standards.mjs';
import { runCheck, verifyExecutionReceipt, captureBaseline, changedSinceBaseline } from './lib/execution-evidence.mjs';
import { spawnSync } from 'node:child_process';
import { validateDevelopmentGate } from './lib/development-gate.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(),'layout-suite-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(ref,body)=>{const file=path.join(root,ref);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
  put('yss-project.yaml',{schema_version:1,repository_mode:'project-instance',governance_profile:'docs/process/mvc-governance-profile.yaml'});
  put('.yss/scaffold-generation.json',{base_package:'com.acme'});
  for(const ref of ['docs/process/mvc-package-layout.yaml','docs/process/mvc-governance-profile.yaml','docs/process/applicable-standards.yaml','docs/process/schemas/mvc-type-layout.schema.json'])put(ref,readFileSync(new URL('../'+ref,import.meta.url)));
  put('CONTEXT.md','工程测试上下文'); put('baseline.md','固定六模块 MVC');
  const policy=loadPackageLayout(root);
  const row=(module,pkg,name,role)=>({type:`com.acme.${pkg}.${name}`,module,feature:'rbc',role,package:`com.acme.${pkg}`,path:`${module}/src/main/java/com/acme/${pkg.replaceAll('.','/')}/${name}.java`,rule_id:`mvc.layout.${role}`});
  const contract=types=>({status:'validated',allowed_write_paths:policy.modules,mvc_structure:{type_layout:{schema_version:1,policy_id:policy.policy_id,policy_version:policy.policy_version,policy_digest:policy.digest,types}}});
  for(const module of policy.modules)mkdirSync(path.join(root,module),{recursive:true});
  return {root,put,policy,row,contract};
}

test('MVC 实际 Controller 改名 Endpoint 仍不能放在 server.rbc', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mvc-layout-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'server/src/main/java/com/acme/server/rbc/Endpoint.java');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, 'package com.acme.server.rbc; import org.springframework.web.bind.annotation.RestController; @RestController public class Endpoint {}');
  writeFileSync(path.join(root, 'yss-project.yaml'), 'schema_version: 1\nrepository_mode: project-instance\ngovernance_profile: docs/process/mvc-governance-profile.yaml\n');
  mkdirSync(path.join(root, 'docs/process'), { recursive: true });
  mkdirSync(path.join(root, '.yss'));
  writeFileSync(path.join(root, '.yss/scaffold-generation.json'), '{"base_package":"com.acme"}');
  // 使用当前维护源规则（修复前尚无机器规则，仍应从实际调用暴露漏检）。
  try { copyFileSync(new URL('../docs/process/mvc-package-layout.yaml', import.meta.url), path.join(root, 'docs/process/mvc-package-layout.yaml')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.match(checkMvcStructure(root, {}).join('\n'), /mvc\.layout\.controller/);
});

test('实现前门禁不信任 validated；角色包、模块、路径、写入范围全部校验',t=>{
  const f=fixture(t);
  const good=f.row('server','server.controller.rbc','Endpoint','controller');
  assert.deepEqual(validateLayoutPlan(f.root,f.contract([good])).errors,[]);
  for(const row of [f.row('server','server.rbc','Endpoint','controller'),{...good,module:'core'}, {...good,path:good.path.replace('Endpoint.java','Other.java')}, {...good,package:'com.other.server.controller.rbc'}, {...good,rule_id:'mvc.layout.model'}])assert.ok(validateLayoutPlan(f.root,f.contract([row])).errors.length);
  const limited=f.contract([good]);limited.allowed_write_paths=['repository'];
  assert.match(validateLayoutPlan(f.root,limited).errors.join('\n'),/超出合同/);
  assert.equal(validateLayoutPlan(f.root,{status:'validated'},{...f.policy},{historical:true}).compatibility,'legacy-readable');
  assert.equal(validateLayoutPlan(f.root,{status:'validated'},f.policy,{historical:true}).compliant,false);
  assert.ok(validateLayoutPlan(f.root,{status:'validated'}).errors.length);
  const stale=f.contract([good]);stale.mvc_structure.type_layout.policy_digest='0'.repeat(64);
  assert.match(validateLayoutPlan(f.root,stale).errors.join('\n'),/过期/);
});

test('实际 AST 职责覆盖改名、限定名、Advice、Schedule、Configuration、Entity、Mapper、MapStruct',t=>{
  const f=fixture(t);
  const cases=[
    ['server','controller','@org.springframework.web.bind.annotation.RestController public class Endpoint {}','Endpoint'],
    ['server','advice','@org.springframework.web.bind.annotation.RestControllerAdvice public class Advice {}','Advice'],
    ['server','schedule','public class Job { @org.springframework.scheduling.annotation.Scheduled(cron="x") void run() {} }','Job'],
    ['server','configuration','@org.springframework.context.annotation.Configuration public class Beans {}','Beans'],
    ['repository','entity','@com.baomidou.mybatisplus.annotation.TableName("x") public class Record {}','Record'],
    ['repository','mapper','public interface Access extends com.baomidou.mybatisplus.core.mapper.BaseMapper<Record> {}','Access'],
    ['repository','convertor','@org.mapstruct.Mapper public interface Convert {}','Convert']
  ];
  const rows=[];
  for(const [module,role,body,name] of cases){const r=f.row(module,`${module}.rbc`,name,role);rows.push(r);f.put(r.path,`package ${r.package}; ${body}`);}
  const bad=checkPackageLayout(f.root,parseJavaProject(f.root),f.contract(rows),{files:rows.map(r=>r.path)}).join('\n');
  for(const [,role] of cases)assert.match(bad,new RegExp(`mvc\\.layout\\.${role}`));
  for(const r of rows)rmSync(path.join(f.root,r.path));
  const good=[];
  for(const [module,role,body,name] of cases){const r=f.row(module,`${module}.${role}.rbc`,name,role);good.push(r);f.put(r.path,`package ${r.package}; ${body}`);}
  assert.deepEqual(checkPackageLayout(f.root,parseJavaProject(f.root),f.contract(good),{files:good.map(r=>r.path)}),[]);
});

test('漏登记、多顶层、成员类型、包目录偏差和虚假职责不能绕过',t=>{
  const f=fixture(t);
  const row=f.row('server','server.controller.rbc','Endpoint','controller');
  f.put(row.path,`package ${row.package}; @org.springframework.web.bind.annotation.RestController public class Endpoint { static class Inner {} } @org.springframework.web.bind.annotation.RestController class Extra {}`);
  let classes=parseJavaProject(f.root);
  assert.equal(classes.length,3);
  assert.match(checkPackageLayout(f.root,classes,f.contract([row]),{files:[row.path]}).join('\n'),/未登记/);
  const extra={...row,type:row.package+'.Extra',source_type:'Endpoint'};
  const inner={...row,type:row.type+'.Inner'};
  assert.deepEqual(checkPackageLayout(f.root,classes,f.contract([row,extra,inner]),{files:[row.path]}),[]);
  const fake={...row,role:'model',rule_id:'mvc.layout.model'};
  assert.match(checkPackageLayout(f.root,classes,f.contract([fake]),{files:[row.path]}).join('\n'),/真实职责冲突/);
  f.put(row.path,'package com.acme.server.rbc; @org.springframework.web.bind.annotation.RestController public class Endpoint {}');
  assert.match(checkPackageLayout(f.root,parseJavaProject(f.root),{}, {audit:true}).join('\n'),/目录不一致/);
  rmSync(path.join(f.root,row.path));
  f.put(row.path.replace('/Endpoint.java','/extra/Endpoint.java'),`package ${row.package}; @org.springframework.web.bind.annotation.RestController public class Endpoint {}`);
  assert.match(checkPackageLayout(f.root,parseJavaProject(f.root),{}, {audit:true}).join('\n'),/目录不一致/);
});

test('本项目继承、相对嵌套父类、元注解、无后缀实体与静态导入',t=>{
  const f=fixture(t);
  f.put('repository/src/main/java/com/acme/repository/entity/Outer.java','package com.acme.repository.entity; public class Outer { @com.baomidou.mybatisplus.annotation.TableName("a") public static class Base {} public static class Child extends Base {} }');
  f.put('repository/src/main/java/com/acme/repository/entity/Other.java','package com.acme.repository.entity; public class Other extends Outer.Base {}');
  f.put('repository/src/main/java/com/acme/repository/rbc/Record.java','package com.acme.repository.rbc; import com.acme.repository.entity.Outer; import static com.baomidou.mybatisplus.annotation.IdType.ASSIGN_ID; public class Record extends Outer.Base { @com.baomidou.mybatisplus.annotation.TableId(type=ASSIGN_ID) Long id; }');
  f.put('repository/src/main/java/com/acme/repository/rbc/Wild.java','package com.acme.repository.rbc; import com.acme.repository.entity.*; public class Wild extends Outer.Base {}');
  f.put('server/src/main/java/com/acme/server/rbc/Api.java','package com.acme.server.rbc; @org.springframework.web.bind.annotation.RestController public @interface Api {}');
  f.put('server/src/main/java/com/acme/server/rbc/Endpoint.java','package com.acme.server.rbc; @Api public class Endpoint {}');
  const parsed=parseJavaProject(f.root);
  const errors=checkPackageLayout(f.root,parsed,{}, {audit:true}).join('\n');
  assert.match(errors,/mvc\.layout\.entity:.*Record/);
  assert.match(errors,/mvc\.layout\.entity:.*Wild/);
  assert.deepEqual(identifyRoles(parsed.find(c=>c.name.endsWith('Outer.Child')),parsed,f.policy),['entity']);
  assert.match(errors,/mvc\.layout\.controller:.*Endpoint/);
  assert(!errors.includes('role=unknown package=com.acme.repository.entity reason='));
});

test('切片签名范围允许前片未提交，仍发现本片未登记及签名篡改',t=>{
  const f=fixture(t), a=f.row('server','server.controller.a','A','controller'), b=f.row('server','server.controller.b','B','controller');
  f.put(a.path,`package ${a.package}; @org.springframework.web.bind.annotation.RestController public class A {}`);
  const baseline=captureBaseline(f.root,[]);
  f.put(b.path,`package ${b.package}; @org.springframework.web.bind.annotation.RestController public class B {}`);
  const files=changedSinceBaseline(f.root,baseline,[]);
  assert(!files.includes(a.path));assert(files.includes(b.path));
  const classes=parseJavaProject(f.root);
  assert.deepEqual(checkPackageLayout(f.root,classes,f.contract([b]),{files}),[]);
  assert.match(checkPackageLayout(f.root,classes,f.contract([]),{files}).join('\n'),/未登记/);
  const tampered=JSON.parse(readFileSync(path.join(f.root,baseline),'utf8'));tampered.inputs[b.path]='fake';f.put(baseline,tampered);
  assert.throws(()=>changedSinceBaseline(f.root,baseline,[]),/快照无效/);
});

test('跨切片共享类型按语义合并，键顺序不构成冲突；不同职责不能覆盖',t=>{
  const f=fixture(t), row=f.row('core','core.service.rbc','QueryService','service');
  const reversed=Object.fromEntries(Object.entries(row).reverse());
  const merged=mergeLayoutTypes([f.contract([row]),f.contract([reversed])]);
  assert.equal(merged.types.length,1);assert.deepEqual(merged.errors,[]);
  assert.match(mergeLayoutTypes([f.contract([row]),f.contract([{...row,role:'policy'}])]).errors.join('\n'),/冲突/);
});

test('Application 明确例外；DTO 和 Processor 无信号要求明确职责',t=>{
  const f=fixture(t);
  const app=f.row('server','server','Application','application');
  f.put(app.path,`package ${app.package}; @org.springframework.boot.autoconfigure.SpringBootApplication public class Application { public static void main(String[] args) {} }`);
  assert.deepEqual(checkPackageLayout(f.root,parseJavaProject(f.root),{}, {audit:true}),[]);
  const dto=f.row('client','client.request.rbc','Input','request');
  f.put(dto.path,`package ${dto.package}; public class Input {}`);
  assert.match(checkPackageLayout(f.root,parseJavaProject(f.root),{}, {audit:true}).join('\n'),/需明确职责/);
  assert.deepEqual(checkPackageLayout(f.root,parseJavaProject(f.root),f.contract([dto]),{files:[dto.path]}),[]);
});

test('真实 Git 变化覆盖未跟踪、暂存和工作区；未修改历史不强迫迁移',t=>{
  const f=fixture(t);
  const git=args=>{const r=spawnSync('git',['-C',f.root,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
  git(['init']);
  const old=f.row('server','server.rbc','Old','controller');f.put(old.path,`package ${old.package}; @org.springframework.web.bind.annotation.RestController public class Old {}`);
  git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','test baseline']);
  const row=f.row('server','server.controller.rbc','Endpoint','controller');f.put(row.path,`package ${row.package}; @org.springframework.web.bind.annotation.RestController public class Endpoint {}`);
  assert.deepEqual(changedJavaFiles(f.root),[row.path]);
  assert.match(checkPackageLayout(f.root,parseJavaProject(f.root),f.contract([])).join('\n'),/未登记/);
  assert.deepEqual(checkPackageLayout(f.root,parseJavaProject(f.root),f.contract([row])),[]);
  git(['add',row.path]);assert.deepEqual(changedJavaFiles(f.root),[row.path]);
  f.put(old.path,readFileSync(path.join(f.root,old.path),'utf8')+'\n');assert(changedJavaFiles(f.root).includes(old.path));
});

test('无影响标签也加载规则；恢复校验合同，规则变化使规范和执行回执失效',t=>{
  const f=fixture(t);f.put('contract.json',f.contract([]));
  const roots={projectRoot:f.root,skillRoot:path.join(f.root,'skills')};
  const request={baseline_ref:'baseline.md',work_units:[{id:'plain',required_skills:[],impacts:[],contract_ref:'contract.json'}]};
  const bundle=resolveApplicableStandards(request,roots);
  assert(contextForWorkUnit(bundle,'plain',roots).required_context_refs.includes('project:docs/process/mvc-package-layout.yaml'));
  const embedded=f.contract([]);embedded.resolution={applicable_standards:bundle};f.put('contract.json',embedded);
  assert.equal(verifyApplicableStandards(bundle,roots).freshness,'current','合同嵌入规范摘要不能产生自引用失效');
  const definition={id:'static',type:'static',capabilities:[],command:'node -e 0',program:process.execPath,args:['-e','0'],environment:'local',input_paths:[]};
  const contract={allowed_write_paths:['server'],artifacts:{}};
  const receipt=runCheck(f.root,contract,definition);
  assert.deepEqual(verifyExecutionReceipt(f.root,receipt,contract,definition),[]);
  f.put('docs/process/mvc-package-layout.yaml',readFileSync(path.join(f.root,'docs/process/mvc-package-layout.yaml'),'utf8')+'\n# 新版规则\n');
  assert.equal(verifyApplicableStandards(bundle,roots).freshness,'stale');
  assert.match(verifyExecutionReceipt(f.root,receipt,contract,definition).join('\n'),/输入变化/);
  f.put('contract.json',f.contract([f.row('server','server.rbc','Bad','controller')]));
  assert.throws(()=>resolveApplicableStandards(request,roots),/controller/);
});

test('真实实现门禁接受合法计划；自填 validated 的坏包和伪装静态检查仍失败',t=>{
  const f=fixture(t);
  f.put('docs/process/schemas/lifecycle-checkpoint-v2.schema.json',readFileSync(new URL('../docs/process/schemas/lifecycle-checkpoint-v2.schema.json',import.meta.url)));
  f.put('spec.md','# 验收\nAC-1：查询成功');
  const row=f.row('server','server.controller.rbc','Endpoint','controller');
  const contract=f.contract([row]);contract.mvc_structure.production_types=[row.type];
  contract.contract_version='1';contract.acceptance_ids=['AC-1'];
  contract.artifacts={spec:'spec.md',requirements:'requirements.json'};
  const args=['scripts/verify-mvc-structure.mjs','--contract','contract.json'];
  contract.verification_plan=[{id:'ast',type:'static',program:'node',args,command:['node',...args].join(' '),capabilities:['mvc-ast'],environment:'local',input_paths:['server']}];
  contract.required_checks=contract.verification_plan.map(c=>c.command);
  f.put('requirements.json',{schema_version:1,acceptance_ids:['AC-1'],requirements:[{requirement_id:'REQ-1',source:{ref:'spec.md',digest:hashLayout(readFileSync(path.join(f.root,'spec.md'))),location:'验收',kind:'body',excerpt:'查询成功'},disposition:'in-scope',acceptance_ids:['AC-1'],rule_ids:[],scenario_ids:['SC-1']}],rules:[],scenarios:[{scenario_id:'SC-1',acceptance_ids:['AC-1'],given:'查询',when:'请求',then:'成功',check_ids:['ast']}]});
  f.put('contract.json',contract);
  const request={baseline_ref:'baseline.md',context_refs:['spec.md'],work_units:[{id:'api',required_skills:[],impacts:[],contract_ref:'contract.json'}]};
  const bundle=resolveApplicableStandards(request,{projectRoot:f.root,skillRoot:path.join(f.root,'skills')});
  contract.resolution={applicable_standards:bundle};f.put('contract.json',contract);f.put('standards.json',bundle);
  const state={schema_version:2,policy_id:'acceptance-driven-v1',standards_context_version:1,goal:'查询成功',baseline_ref:'baseline.md',baseline_digest:hashLayout(readFileSync(path.join(f.root,'baseline.md'))),acceptance_ids:['AC-1'],status:'running',blockers:[],slices:[{id:'api',standards_ref:'standards.json',standards_digest:bundle.digest,active_work_unit:'api',contract_ref:'contract.json',contract_version:'1',acceptance_ids:['AC-1']}]};
  assert.deepEqual(validateDevelopmentGate(f.root,state,'implementation'),[]);
  for(const flag of ['--plan-only','--historical','--audit-all']) {
    const bad=structuredClone(contract);bad.verification_plan[0].args.push(flag);bad.verification_plan[0].command+=' '+flag;bad.required_checks=[bad.verification_plan[0].command];f.put('contract.json',bad);
    assert.match(validateDevelopmentGate(f.root,state,'implementation').join('\n'),/标准 argv/);
  }
  const bad=structuredClone(contract);bad.mvc_structure.type_layout.types=[f.row('server','server.rbc','Endpoint','controller')];f.put('contract.json',bad);
  assert.match(validateDevelopmentGate(f.root,state,'implementation').join('\n'),/mvc\.layout\.controller/);
});
