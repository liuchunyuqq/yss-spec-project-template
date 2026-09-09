import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const source = path.resolve(import.meta.dirname, '..');
test('新项目需求初始化生成可校验 v2，拒绝覆盖、无验收基线和越界', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'checkpoint-init-'));
  try {
    cpSync(path.join(source, 'scripts'), path.join(root, 'scripts'), {recursive:true});
    cpSync(path.join(source, 'docs/process'), path.join(root, 'docs/process'), {recursive:true});
    writeFileSync(path.join(root, 'yss-project.yaml'), 'schema_version: 1\nrepository_mode: project-instance\n');
    mkdirSync(path.join(root, 'docs/.scratch/demo'), {recursive:true});
    writeFileSync(path.join(root, 'docs/.scratch/demo/spec.md'), '# 验收\n- AC-01：可查询\n- AC-02：拒绝无权限请求\n');
    const args = ['--goal', '实现查询', '--baseline', 'docs/.scratch/demo/spec.md', '--output', 'docs/.scratch/demo/checkpoint.yaml'];
    const run = extra => spawnSync(process.execPath, ['scripts/init-acceptance-checkpoint.mjs', ...extra], {cwd:root, encoding:'utf8'});
    const first = run(args); assert.equal(first.status, 0, first.stderr);
    const file = path.join(root, 'docs/.scratch/demo/checkpoint.yaml');
    const state = JSON.parse(readFileSync(file));
    assert.deepEqual(state.acceptance_ids, ['AC-01','AC-02']);
    assert.equal(state.status, 'running'); assert.deepEqual(state.slices, []);
    const check = spawnSync(process.execPath, ['scripts/verify-lifecycle-checkpoint', 'docs/.scratch/demo/checkpoint.yaml'], {cwd:root,encoding:'utf8'});
    assert.equal(check.status, 0, check.stderr);
    const before = readFileSync(file, 'utf8'); assert.notEqual(run(args).status, 0); assert.equal(readFileSync(file,'utf8'), before);
    writeFileSync(file, 'schema_version: 2\nstatus: in_progress\nfeature: demo\n');
    const invalid = spawnSync(process.execPath, ['scripts/verify-lifecycle-checkpoint', 'docs/.scratch/demo/checkpoint.yaml'], {cwd:root,encoding:'utf8'});
    assert.notEqual(invalid.status,0);
    assert.match(invalid.stderr,/policy_id/); assert.match(invalid.stderr,/修复原记录并重验/);
    assert.notEqual(run(args).status,0);
    assert.match(readFileSync(file,'utf8'),/in_progress/);
    assert.notEqual(run([...args.slice(0,-1), '../escape.yaml']).status, 0);
    writeFileSync(path.join(root, 'docs/.scratch/demo/spec.md'), '# 需求尚未分析');
    assert.notEqual(run([...args.slice(0,-1), 'docs/.scratch/demo/empty.yaml']).status, 0);
  } finally {rmSync(root, {recursive:true, force:true});}
});
