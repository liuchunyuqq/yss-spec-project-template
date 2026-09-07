# 验收驱动核心聚焦独立审查

- result: pass
- scope: acceptance-core
- reviewer: acceptance-reviewer（role.test-engineer，Reviewer）
- implementers: 主控实施者
- baseline: a97724d8c62a052d277d6e143ad1a5c7b553410f
- acceptance_ids: 自主推进、切片与整体 Review、相关证据有效后完成
- candidate_digest: 下列 SHA256 文件清单；只覆盖任务包列出的七个文件，没有删除文件。

| 文件 | SHA256 |
|---|---|
| scripts/lib/acceptance-policy.mjs | C69AA8724BE76F7A210144CDB77D45D1B00B9AB17F6EE82EE1964D48A8207496 |
| scripts/lib/lifecycle-transition.mjs | 9BF2760FDCB2FE44538BBED1344C80FC322532F3F7C199BE89CE0D116809BA2C |
| scripts/lib/implementation-contract-compiler.mjs | CA780D0E3B8C44EA77417663504E6378575F6A504450FB8B96D43D84C3829A74 |
| scripts/acceptance-policy.test.mjs | 137C9AC51B3AFB7E031976F3820DFAE027CF7CA9BF03F1933293FB137FF52543 |
| scripts/verify-lifecycle-checkpoint | 3F7808A31103EEDB78B163B3859C31110BA7AF8F3E41CB9897FE21A2A498900F |
| docs/process/acceptance-policy.yaml | D235EA272CBF517118DE1F56C540D2805C1FA86A85BA33C9D265B646150F6892 |
| docs/process/schemas/lifecycle-checkpoint-v2.schema.json | 9DB0FA60E59609EED6C5D6CFAD2BDFC65C208BE04C4D29CBE7AF929DC5F9CB1B |

## Findings

1. **[P1] 整体验收范围可以被空数组覆盖。** scripts/lib/acceptance-policy.mjs:63 使用 item.acceptance_ids 优先于顶层 ids，overall 接受任意 object。对有效 fixture 设置 state.overall.acceptance_ids=[] 和 overall review.acceptance_ids=[]，仍返回 []。因此整体 Review 可以未检查任何 AC 却完成。整体检查必须固定覆盖顶层 AC，不允许 overall 自行缩减范围。状态：resolved，kind=defect（见复查）。
2. **[P1] 基线变化不使旧验收证据失效。** scripts/lib/acceptance-policy.mjs:44 只检查 baseline_ref 可读，没有比较基线摘要，也未要求 review.inputs 包含它。对有效 fixture 仅将 baseline 的 digest 从 baseline 改为 changed-baseline，仍返回 []。同一个 AC 编号下的业务口径变更会错误复用旧 Review。需要绑定基线内容与相关证据，并补相同 ID 但需求正文变化的回归。状态：resolved，kind=defect（见复查）。
3. **[P2] v2 入口忽略已知过期输入。** scripts/lib/lifecycle-transition.mjs:253 调用 selectDevelopmentAction，但该函数仅检查 stale===true，不检查 stale_inputs。输入含 stale_inputs:['openapi']、其余合同字段有效，返回 result=allowed；v1 第 232 行却能识别该信号。应将其路由为 refresh-inputs 后再进入实现，不能消费已知过期契约。状态：resolved，kind=defect（见复查）。

## 实际验证

2026-09-07 执行 node --test scripts/acceptance-policy.test.mjs，退出码 0，5/5 通过；现有用例不覆盖上述反例。

另执行 PowerShell here-string 管道至 node --input-type=module 的内存 fixture，无文件写入。使用 contentDigest/evidenceKey 构造有效切片与整体证据，resolve 返回对应对象，digest 返回当前文件摘要。实际输出：

```text
overall acceptance bypass: []
changed baseline accepted: []
stale inputs entry: { result: 'allowed', blocking_signals: [], missing_requirements: [], evidence_refs: [ 'slice' ], next_work_unit: null }
```

复现时可直接复制 scripts/acceptance-policy.test.mjs 的 fixture：第一项同时清空 state.overall.acceptance_ids 与 refs['overall-review'].acceptance_ids；第二项仅修改 options.digest 对 baseline.md 的返回值；第三项在入口测试的 state 增加 stale_inputs:['openapi']。上述三项在修复后均应被拒绝或重新路由。

本次不修改实现、不宣布模板发布通过；无 UI 影响。


## 修复后复查

2026-09-07 独立读取修复后的实现，并执行：

```powershell
node --test scripts/acceptance-policy.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs
```

退出码 0，8/8 通过（核心 6、迁移 2）。上述三个 findings 均关闭：整体 requiredIds 固定取顶层验收列表；baseline_digest 同时绑定当前基线和 Review；stale_inputs 触发 refresh-inputs 并阻止当前实现入口。新增回归覆盖了空整体验收列表、基线正文变化及更新状态但未更新审查、过期输入。

扩展只读检查了 governance-migration.mjs 与 migrate_governance.test.mjs：目标是固定 GOVERNANCE_FILES 白名单；项目身份和外置环境版本受检；普通受管文件的摘要不匹配时整次应用被拒绝；lock 只升级 requiredToolVersion 并保留其他字段；应用前备份原文、再次检查并发内容变化；已迁移项目幂等。测试实际覆盖预览不写入、定制冲突不覆盖、备份、锁版本升级及幂等，未发现需要修复的新缺陷。

边界：此次迁移测试为构造的本地项目，不代表真实历史版本完整工程和外部 skillUtils 的端到端升级已经通过；该集成验证由主控完成。本报告不替代发布门禁。

### 复查候选 SHA256
- scripts/lib/acceptance-policy.mjs: 67B7ABFF0805F0B3B678A293CCDFDD4D8088203B4C2172A4969E67F582B49589
- scripts/lib/lifecycle-transition.mjs: 9BF2760FDCB2FE44538BBED1344C80FC322532F3F7C199BE89CE0D116809BA2C
- scripts/lib/implementation-contract-compiler.mjs: CA780D0E3B8C44EA77417663504E6378575F6A504450FB8B96D43D84C3829A74
- scripts/acceptance-policy.test.mjs: 457980F876C15E7F83A3C8B2DD85927EFC65DD0FFD570FB5C764576A0F918400
- scripts/verify-lifecycle-checkpoint: 3F7808A31103EEDB78B163B3859C31110BA7AF8F3E41CB9897FE21A2A498900F
- docs/process/acceptance-policy.yaml: D235EA272CBF517118DE1F56C540D2805C1FA86A85BA33C9D265B646150F6892
- docs/process/schemas/lifecycle-checkpoint-v2.schema.json: 08ED6459F56B706B788B25B209FFEBB946EF72C4F8DED7CDBC33BB000F66BCA1
- .agents/skills/yss-mvc-scaffold-generator/scripts/lib/governance-migration.mjs: 22E3EBC85018F346D0BA5FE0A6C3B43395B7D82A2CF10739ECB2CEF1E1AAF8B7
- .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs: 025DD282633CB2D13A5AC445609003A8E673E8B44B0EF8F081E6D7C4C0F42647
