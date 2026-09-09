import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkMvcStructure } from './lib/mvc-structure.mjs';

test('G04 AST 识别生产类继承和组合 InMemory，忽略测试源码', t => {
  const root = mkdtempSync(path.join(os.tmpdir(),'mvc-ast-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put = (ref,text) => {mkdirSync(path.dirname(path.join(root,ref)),{recursive:true});writeFileSync(path.join(root,ref),text);};
  put('adapter/src/main/java/p/InMemoryStore.java','package p; public class InMemoryStore {}');
  put('adapter/src/main/java/p/OracleStore.java','package p; public class OracleStore extends InMemoryStore {}');
  let result=checkMvcStructure(root,{production_types:['p.OracleStore']});
  assert.match(result.join('\n'), /production-mock.*OracleStore/);
  put('adapter/src/main/java/p/OracleStore.java','package p; public class OracleStore { private InMemoryStore delegate; }');
  assert.match(checkMvcStructure(root,{production_types:['p.OracleStore']}).join('\n'), /production-mock/);
  put('adapter/src/main/java/p/OracleStore.java','package p; public class OracleStore { public void save() { InMemoryStore.save(); } }');
  assert.match(checkMvcStructure(root,{production_types:['p.OracleStore']}).join('\n'), /production-mock/);
  put('adapter/src/main/java/p/OracleStore.java','package p; public class OracleStore {}');
  put('adapter/src/test/java/p/FakeTest.java','package p; public class FakeTest extends InMemoryStore {}');
  assert.deepEqual(checkMvcStructure(root,{production_types:['p.OracleStore']}), []);
});

test('G05-G08 Entity/MP、Service、Wrapper 和注释检查；合法 XML 不误报', t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'mvc-shape-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(name,text)=>{const ref=path.join(root,'repository/src/main/java/p',name);mkdirSync(path.dirname(ref),{recursive:true});writeFileSync(ref,text);};
  put('Record.java','package p; @TableName("record") public class Record extends YssEntity { /** 业务记录唯一标识。 */ @TableId(type=IdType.ASSIGN_ID) private Long id; }');
  put('RecordMapper.java','package p; public interface RecordMapper extends YssMapper<Record> {}');
  put('RecordService.java','package p; public interface RecordService { /** 查询不存在时返回空值。 */ Record find(); }');
  put('RecordServiceImpl.java','package p; public class RecordServiceImpl implements RecordService { /** 根据当前用户查询记录，不修改数据。 */ public Record find() {return null;} }');
  put('RecordMapper.xml','<mapper><select id="complex">select id from record</select></mapper>');
  const profile={production_types:['p.RecordServiceImpl'],entity_types:['p.Record'],entity_bases:['YssEntity'],mapper_types:['p.RecordMapper'],mapper_bases:['YssMapper']};
  assert.deepEqual(checkMvcStructure(root,profile),[]);
  put('RecordController.java','package p; @RestController public class RecordController { private RecordServiceImpl service; }');
  assert.match(checkMvcStructure(root,profile).join('\n'),/controller-service-interface/);
  put('RecordMapper.java','package p; public interface RecordMapper { java.util.Map query(); }');
  put('RecordService.java','package p; public class RecordService { public void save() {} }');
  put('PageResult.java','package p; public class PageResult {}');
  const errors=checkMvcStructure(root,profile).join('\n');
  assert.match(errors,/mp-mapper-required/);assert.match(errors,/service-interface-required/);assert.match(errors,/business-javadoc/);assert.match(errors,/custom-wrapper/);
});
