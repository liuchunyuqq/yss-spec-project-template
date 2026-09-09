import test from 'node:test';
import assert from 'node:assert/strict';
import {validateVerificationPlan} from './lib/verification-plan.mjs';
test('G13/G17 Mock 不替代数据库检查，compile 不得伪装 package',()=>{
  const check={id:'mock',command:'mvnw test',program:'mvnw',args:['test'],type:'mock-integration',capabilities:['persistence'],environment:'mock',input_paths:['src']};
  const contract={required_checks:['mvnw test'],verification_plan:[check]};
  assert.match(validateVerificationPlan(contract,['persistence-impact']).join('\n'),/database-integration/);
  assert.deepEqual(validateVerificationPlan(contract,[]),[]);
  check.command='mvnw package';contract.required_checks=['mvnw package'];
  assert.match(validateVerificationPlan(contract).join('\n'),/program\/args/);
  check.args=['-DskipTests','package'];check.command='mvnw -DskipTests package';contract.required_checks=[check.command];
  assert.match(validateVerificationPlan(contract).join('\n'),/跳过测试/);
});
