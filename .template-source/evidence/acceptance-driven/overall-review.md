# 验收驱动整体独立 Review

- result: pass
- scope: overall
- reviewer: acceptance-reviewer（独立 role.test-engineer / Reviewer）
- implementers: 主控实施者
- baseline: a97724d8c62a052d277d6e143ad1a5c7b553410f
- 验收范围：用户批准方案中的自主推进、两层审查、相关验证、MVC 生成和旧项目治理迁移、插件分发。

## 实际发现

**[P2] 旧项目的流程和验证机器配置未迁移。** governance-migration.mjs 的固定白名单未含 docs/process/implementation-repo-registry.yaml 与 docs/process/analysis-project.yaml。envelope.mjs 已为新建项目删除重复 validate/test，将 single-release-confirmation 改为 overall-review-and-acceptance；旧项目迁移不读取这两文件，必然保留旧配置。还未检查 yss-project.yaml 的 governance_profile：自定义旧指针会继续消费旧 Profile，而迁移成功只写默认路径。应对已知旧生成值定点更新并保留其他字段，未知 Profile 指针报冲突，缺少指针补默认；增加旧项目配置回归。kind=defect，status=resolved（见复查）。

**[P2] v2 模板未列出实际必需证据字段。** acceptance-checkpoint-template.yaml 的注释遗漏 checks.command、checks.environment 和 Review.baseline_digest；按模板列出的字段生成记录会被 validator 拒绝。需要同步可消费字段，避免自主运行再次陷入无效记录修复。kind=defect，status=resolved（见复查）。

## 已覆盖审查

- 核心审查的 3 个缺陷已修复并独立复查，见 core-review.md。
- 权威 acceptance-policy 与说明、生命周期入口及项目 AGENTS 将新任务导向 v2，逐资产批准明确限定历史规则；新建 MVC 入口改成专用模板。
- exporter 的 obsolete 只来自 previous.files 且排除 .iml/.idea；新增集成用例放入未受管 IDE 文件并检查导出后保留。静态检查未发现该保护路径新增缺陷；隔离执行结果待主控提供。
- 迁移备份、未知定制冲突拒绝、版本升级保留 lock 字段、幂等已通过独立测试。

## 验证

2026-09-07 执行 node --test scripts/acceptance-policy.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs，退出码 0，8/8 通过。未把其他已有模板环境失败计为本轮缺陷。主控正在进行新建/恢复/隔离插件集成验证，当前报告不声明最终全部验收通过。


## 2026-09-08 修复复查

两个 findings 均关闭。独立读取定点 YAML 迁移实现与新增测试，确认旧生成的验证三连仅保留 package，其他命令保留；workflow 旧生成值替换而其他项保留；缺少治理指针补默认，未知指针阻止整次应用。模板已列出 checks.command/environment 和 Review.inputs/baseline_digest，基线指向本需求 Spec。

独立执行 node --test scripts/acceptance-policy.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs：退出码 0，9/9 通过。代码与规则整体 Review 无未关闭 finding。隔离插件端到端最终运行证据仍待主控补充；本结论是范围内审查通过，不是模板发布授权。

复查候选 SHA256：
- .agents/skills/yss-mvc-scaffold-generator/scripts/lib/governance-migration.mjs: 585D1879605428A04C136A5AE5CAA9C8BF00409B1A85972BAC2328ED743966FD
- .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs: 4CB743E2FAC04B70A939348F9B380325ADD54DE5BF8B2A92F72BBDCA767AAC62
- docs/process/templates/acceptance-checkpoint-template.yaml: 759D55C4C58E6A646F9C69B3651A6D57C729FB940C58A475DE5E48A27B5BD0FE
- .agents/skills/yss-mvc-scaffold-generator/scripts/export_plugin.mjs: 6951A96BCEC4F8995A7879EE9839EC1172EB185519ED4BC3225AEB75598577A4
- .agents/skills/yss-mvc-scaffold-generator/scripts/verify_plugin_integration.mjs: 0571E5BC8C4C75B86DCA95EE65734CAEB67EDDEA59F8F3379F22EADAE7097911

## MVC adapted skills 追加复查

独立检查 yss-application、yss-repository、yss-mybatis、yss-web-controller 四份 SKILL.md。共同实现前置已使用当前 validated 合同，并明确目标内自主补齐技术输入/刷新、无需逐项批准；工程失败不得冒充业务完成。发现 mybatis 分页说明仍有“批准 DTO”措辞，已回报主控作同类文本清理，不新增审批或扩展审查范围。

主控回传最终执行摘要：核心 12/12、MVC 28/28、隔离插件生成/真实 clone 恢复/clean tree/38 skills/同步漂移反例通过。这些是主控执行证据；本 Reviewer 已独立执行的 9/9 结果见上节。四份 adapted skills 的生成副本断言正在由主控验证。

已再次读取 mybatis 分页说明，确认改为“当前契约定义的 DTO”。四份 adapted skills 本次批准语义清理复查通过，无未关闭问题；未重复运行未变化的生成代码测试。

## MVC Profile 最终配置确认

已只读确认 required_work_units 仅保留 entry-triage、slice-implementation、code-review；需求分析、Spec、技术分析与拆分移入 conditional_work_units；release-and-retrospective 位于 external_delivery_work_units。默认开发完成不再隐式依赖发布工作单元。主控回传 Profile 校验、针对性生成断言及隔离插件复验退出码均为 0；本次未重复运行验证或扩展审查。整体审查结论保持 pass。
