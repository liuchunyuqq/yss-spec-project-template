import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateWritePaths, validateOpenApi, validateTraceability } from './lib/contract-integrity.mjs';

test('G02 正确新文件允许；错误模块、越界和候选超范围拒绝', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'contract-path-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'core')); writeFileSync(path.join(root, 'pom.xml'), '<project/>');
  assert.deepEqual(validateWritePaths(root, ['core/src'], ['core/src/New.java']), []);
  for (const ref of ['project-core/src', '../outside', 'C:/outside']) assert.ok(validateWritePaths(root, [ref]).length);
  assert.ok(validateWritePaths(root, ['core/src'], ['core/other/A.java']).length);
});
const api = () => ({ openapi: '3.1.0', info: {title: '查询', version: '1'}, paths: { '/items/{id}': { get: { parameters: [{name:'id', in:'path', required:true, schema:{type:'string'}}], responses: {'200':{description:'结果',content:{'application/json':{schema:{type:'object',properties:{id:{type:'string'}},required:['id']}}}},'400':{description:'失败',content:{'application/json':{schema:{type:'string'}}}}} } } } });
test('G03 description-only、缺路径参数、悬空 schema 拒绝；具体响应和下载允许', () => {
  assert.deepEqual(validateOpenApi(api()), []);
  const invalidType=api();invalidType.paths['/items/{id}'].get.responses['200'].content['application/json'].schema={type:'banana'};
  assert.match(validateOpenApi(invalidType).join('\n'),/非法 schema type/);
  const bad = api(); delete bad.paths['/items/{id}'].get.responses['200'].content;
  assert.match(validateOpenApi(bad).join('\n'), /具体 schema/);
  const missing = api(); missing.paths['/items/{id}'].get.parameters = [];
  assert.match(validateOpenApi(missing).join('\n'), /路径参数/);
  const ref = api(); ref.paths['/items/{id}'].get.responses['200'].content['application/json'].schema = {$ref:'#/components/schemas/Missing'};
  assert.match(validateOpenApi(ref).join('\n'), /悬空/);
  const download = api(); download.paths['/items/{id}'].get.responses['200'].content = {'application/octet-stream':{schema:{type:'string',format:'binary'}}};
  assert.deepEqual(validateOpenApi(download), []);
});
test('G01/G11 来源遗漏、摘要变化、AC 缩写和语义变更无裁决拒绝', () => {
  const trace = { schema_version:1, acceptance_ids:['AC-01'], requirements:[{requirement_id:'REQ-01',source:{ref:'source.md',location:'第1段',digest:'abc',kind:'body',excerpt:'保存后重启仍可查询'}, disposition:'in-scope',acceptance_ids:['AC-01'],rule_ids:[],scenario_ids:['SC-01']}], rules:[], scenarios:[{scenario_id:'SC-01',acceptance_ids:['AC-01'],given:'保存一项记录',when:'重启服务再查询',then:'记录仍在',check_ids:['db']}], changes:[] };
  const context = { digest: () => 'abc', checkIds:['db'], acceptanceIds:['AC-01'] };
  assert.deepEqual(validateTraceability(trace, context), []);
  const wrong = structuredClone(trace); wrong.requirements[0].acceptance_ids=['AC-1'];
  assert.ok(validateTraceability(wrong, context).length);
  const empty = structuredClone(trace); empty.requirements=[];
  assert.ok(validateTraceability(empty, context).length);
  assert.ok(validateTraceability(trace, {...context,digest:()=> 'changed'}).length);
  const weakened = structuredClone(trace); weakened.changes=[{requirement_id:'REQ-01',before:'真实保存',after:'存在 DDL'}];
  assert.ok(validateTraceability(weakened, context).length);
});
test('列表查询的行来源约束同时适用 POST 和 GET，显式批量写操作可单独声明',()=>{
  const doc=api();const operation=doc.paths['/items/{id}'].get;
  operation.responses['200'].content['application/json'].schema={type:'array',items:{type:'string'}};
  doc.paths['/items/{id}']={post:operation};
  assert.match(validateOpenApi(doc).join('\n'),/行来源/);
  operation['x-query-contract']={row_source:'适用任务集合',identity_source:'服务端会话',permission:'当前用户可见',filter_sort_page_order:'权限、过滤、排序、分页',field_sources:{name:'任务定义'},missing_fact_defaults:{status:'未提交'},scenario_ids:['SC-empty','SC-identity']};
  assert.deepEqual(validateOpenApi(doc),[]);
  delete operation['x-query-contract'];operation['x-operation-kind']='mutation';
  assert.deepEqual(validateOpenApi(doc),[]);
});
