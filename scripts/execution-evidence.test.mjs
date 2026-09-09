import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {runCheck,verifyExecutionReceipt,captureBaseline,changedSinceBaseline,verifyReviewRuntime} from './lib/execution-evidence.mjs';
test('G15 执行器记录实际成功/失败，手写成功和源码变化拒绝',t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'evidence-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(path.join(root,'src'));writeFileSync(path.join(root,'src/check.cjs'),'process.exit(0)');
  const check={id:'unit',type:'unit',capabilities:['behavior'],command:'node src/check.cjs',program:process.execPath,args:['src/check.cjs'],environment:'local',input_paths:['src']};
  const contract={allowed_write_paths:['src'],artifacts:{},verification_plan:[check]};
  const evidence=runCheck(root,contract,check);
  assert.equal(evidence.exit_code,0);
  assert.deepEqual(verifyExecutionReceipt(root,evidence,contract,check),[]);
  const previous=process.env.YSS_GOVERNANCE_TEST_ENV;
  process.env.YSS_GOVERNANCE_TEST_ENV='changed';
  assert.match(verifyExecutionReceipt(root,evidence,contract,check).join('\n'),/环境变化/);
  if(previous===undefined) delete process.env.YSS_GOVERNANCE_TEST_ENV; else process.env.YSS_GOVERNANCE_TEST_ENV=previous;
  const fake={...evidence,run_id:'invented'};
  assert.ok(verifyExecutionReceipt(root,fake,contract,check).length);
  writeFileSync(path.join(root,'src/check.cjs'),'process.exit(3)');
  assert.ok(verifyExecutionReceipt(root,evidence,contract,check).length);
  const failed=runCheck(root,contract,check);assert.equal(failed.exit_code,3);
  assert.ok(verifyExecutionReceipt(root,failed,contract,check).length);
});
test('G02/G16 无 HEAD 初始快照发现新增/删除文件；改 reviewer 名无运行记录失败', t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'candidate-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  writeFileSync(path.join(root,'source.txt'),'initial');
  const ref=captureBaseline(root,[]);
  assert.deepEqual(changedSinceBaseline(root,ref,[]),[]);
  writeFileSync(path.join(root,'outside.txt'),'changed');
  assert.deepEqual(changedSinceBaseline(root,ref,[]),['outside.txt']);
  rmSync(path.join(root,'source.txt'));
  assert.deepEqual(changedSinceBaseline(root,ref,[]).sort(),['outside.txt','source.txt']);
  assert.ok(verifyReviewRuntime(root,{reviewer:'another-name'},{}).length);
});

test('原生子 agent Review 无宿主配置通过，缺记录、自审和绑定不一致失败', t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'subagent-review-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const review={execution_ref:'review-run.json',reviewer:'reviewer-1',implementers:['worker-1'],candidate_digest:'candidate-1',acceptance_ids:['AC-1'],findings:[],result:'pass'};
  const record={kind:'subagent-review',actor_instance_id:review.reviewer,implementer_instance_ids:review.implementers,dispatch_id:'dispatch-1',candidate_digest:review.candidate_digest,acceptance_ids:review.acceptance_ids,findings:[],result:'pass',started_at:new Date().toISOString(),ended_at:new Date().toISOString()};
  const put=value=>writeFileSync(path.join(root,review.execution_ref),JSON.stringify(value));
  assert.ok(verifyReviewRuntime(root,review,{}).length);
  put(record);
  assert.deepEqual(verifyReviewRuntime(root,review,{}),[]);
  for(const delta of [{actor_instance_id:'worker-1'},{implementer_instance_ids:['someone-else']},{dispatch_id:''},{candidate_digest:'stale'},{acceptance_ids:['AC-2']},{findings:['unresolved']},{result:'fail'},{started_at:'invalid'},{ended_at:'2999-01-01T00:00:00Z'}]) {
    put({...record,...delta});
    assert.ok(verifyReviewRuntime(root,review,{}).length,JSON.stringify(delta));
  }
});
