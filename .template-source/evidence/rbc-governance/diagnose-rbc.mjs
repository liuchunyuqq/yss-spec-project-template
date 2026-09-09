import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readProjectDocument,validateDevelopmentGate} from '../../../scripts/lib/development-gate.mjs';
import {parseJavaProject,checkMvcStructure} from '../../../scripts/lib/mvc-structure.mjs';
const root=path.resolve(process.argv[2]);
const checkpoint='docs/.scratch/rbc-reporting/checkpoint.yaml';
const refs=['AGENTS.md',checkpoint,'docs/.scratch/rbc-reporting/spec.md','docs/.scratch/rbc-reporting/openapi.yaml','adapter/src/main/java/com/yss/datamiddle/rbc/manage/adapter/oracle/OracleRbcReportingStore.java','adapter/src/main/java/com/yss/datamiddle/rbc/manage/adapter/excel/PoiRbcTemplateValidator.java','core/src/main/java/com/yss/datamiddle/rbc/manage/core/service/RbcReportingService.java','repository/src/main/java/com/yss/datamiddle/rbc/manage/repository/mapper/RbcReportMapper.java','client/src/main/java/com/yss/datamiddle/rbc/manage/client/rbc/RbcDtos.java'];
const digest=()=>Object.fromEntries(refs.map(ref=>[ref,createHash('sha256').update(readFileSync(path.join(root,ref))).digest('hex')]));
const before=digest();const state=readProjectDocument(root,checkpoint);
const legacy=spawnSync(process.execPath,['scripts/verify-development.mjs','--mode','completion','--checkpoint',checkpoint],{cwd:root,encoding:'utf8'});
let classes=[],ast_error=null;
try {classes=parseJavaProject(root);} catch(error) {ast_error=error.message;}
const production=classes.filter(c=>c.simpleName==='OracleRbcReportingStore').map(c=>c.name);
const result={created_at:new Date().toISOString(),read_only:true,input_hashes:before,legacy_exit_code:legacy.status,new_implementation_errors:validateDevelopmentGate(root,state,'implementation'),new_completion_errors:validateDevelopmentGate(root,state,'completion'),ast_error,mvc_findings:ast_error?[]:checkMvcStructure(root,{production_types:production,wrapper_package:'com.yss.cloud.dto.result'},classes),business_behavior_status:'not-executed-read-only-scope',inputs_unchanged:JSON.stringify(before)===JSON.stringify(digest())};
writeFileSync(new URL('./rbc-diagnosis.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({legacy_exit_code:result.legacy_exit_code,implementation_error_count:result.new_implementation_errors.length,completion_error_count:result.new_completion_errors.length,mvc_findings:result.mvc_findings,inputs_unchanged:result.inputs_unchanged},null,2));
