# 验收驱动生命周期重构记录

本轮按用户批准方案实施，仓库身份 template-source，维护强度 L3（lifecycle-gate、ticket-state、generation-semantics、core-validator）。业务 Java 模板不变；本轮是治理执行器、技能、生成封装和分发迁移修改，不生成产品 Spec 或业务 Ticket。流程文档不做代码 TDD；执行器与迁移通过公开函数/CLI 场景、生成回归和独立审查验证。

## 已落地

- acceptance-policy.yaml 与 acceptance-driven-development.md 定义新任务默认策略：目标内自主推进，切片独立 Review、整体 Review，普通技术选择/修复不批准，实际业务歧义和范围边界才提问。
- 新 checkpoint schema v2 与 validated 实现入口不依赖旧批准记录。完成校验检查验收覆盖、独立身份、相关候选与需求基线摘要、实际退出码和验证环境；旧 schema v1 保持只读兼容。
- 更新 AGENTS、生命周期/实现合同编译器、Review、TDD 和 MVC 专项技能；审查发现的问题自动修复。Spec/API/技术分析按需，外部发布不再是 MVC 开发完成前置。
- MVC 使用专用项目 AGENTS 模板；生成外部 skillUtils，环境版本/工具版本 1.1.0；生成项目不附带创建器。
- 旧项目迁移只消费固定白名单：受管摘要不匹配即 conflicts；备份旧文件；定点更新旧验证三连、旧发布确认步骤、版本字段与缺失 Profile 指针，保留自定义项。非默认 Profile 指针拒绝整次应用。业务项目尚未执行迁移。
- 分发同步器仅退役旧发布清单里的文件，排除 .iml/.idea，不再将技能目录所有文件视为受管资产。

## 验证证据

| 检查 | 结果 | 证据 |
|---|---|---|
| 核心执行与合同编译器 | 12/12，退出码 0 | core-tests.log |
| MVC 生成、恢复、迁移 | 28/28，退出码 0 | mvc-tests.log |
| 最后四份适配技能的生成副本 | 1/1，退出码 0 | focused-generation.log |
| 隔离插件生成、真实 Git clone 后环境恢复、工作树干净、38 个技能、负向同步漂移 | 退出码 0 | plugin-integration.log |
| 核心独立审查 | 通过，三项 finding 修复复查关闭 | core-review.md |
| 整体独立审查与适配技能/配置复查 | 通过，无开放 finding | overall-review.md |
| 生命周期转换、注册表、MVC Profile | 退出码 0 | 主控实际命令记录 |
| 技能锁、102 个共享技能投影、MVC 插件分发 | 已同步并核对 | 主控 update-skill-lock / sync-skills / sync-from-source -Check |
| 派生视图与 Git 空白检查 | generate --write/--check、git diff --check 通过 | diff-check.log |

Windows 测试使用 fs.realpathSync.native(os.tmpdir()) 统一 TEMP/TMP，避免 8.3 短路径与 Git 长路径的字符串差异。修复了版本 fixture 的固定版本假设，以及 Node 子进程在 Windows 直接启动无扩展名脚本的问题。派生生成器改为正确消费 CRLF 并保留换行风格，重复生成不再增加空行。

## 未通过的统一模板核验

实际执行 node scripts/run-template-verification --profile fast，因 AGENTS/核心规则变化自动升级 release，失败。详见 fast-verification.log；没有把定向检查通过当成模板全量通过，不宣称 implementation-ready、可合并或可发布。

主要既有阻塞包括工具目录缺少 yaml 依赖、shell 下无 pnpm、技能注册表重复 yss-mvc-scaffold-generator ID，以及历史子任务/前端/候选/Git 子模块场景的环境或 fixture 问题。baseline-diagnostics.json 记录了相关文件未相对 HEAD 修改，HEAD 本身包含两个 MVC skill ID。本轮没有通过降低这些全仓检查来制造通过结果。

隔离测试证明机械生成与分发/恢复路径，不等于真实 Agent 平台发现已验证，也不等于实际业务需求全流程运行验证；plugin-integration.log 明确保留 agent_discovery=not-verified。未运行生成 Java 的 Maven 业务验证，因为本轮不改变 Java/POM 且没有交付新的业务工程。

## 过程纠偏与复盘

- 独立审查发现整体验收列表可缩减、需求基线未绑定、stale_inputs 漏检；均补回归并修复。整体审查补齐旧项目机器配置和 Profile 指针迁移、模板字段及适配技能残留审批语言。
- 自动审批审查曾拒绝整目录迁移与版本回退方案；未执行该操作，改为固定白名单和保留定制的字段级升级后继续。
- 既有导出器曾误删未受管 yss-ddd-scaffold-generator.iml；已从对应源 IDE 文件恢复（未保留删除前该文件的独立摘要，不声称逐字节核对旧值）。其余四个 IDE 文件与对应源逐字节一致。导出器已修复，并增加未受管 IDE 文件保留测试。
- 旧批准规则读取与新执行状态分开，防止通过伪造 approved 简化流程；代码、机器配置和实际分发同时验证，防止只改提示词。

## 使用与边界

新项目直接使用已同步 MVC 插件生成，默认新治理。已有项目先运行 migrate_governance.mjs --project-root <目录> --dry-run，已授权范围内可用 --apply；有冲突时合并，不能强制覆盖。随后 restore_environment.mjs --project-root <目录> --upgrade，并执行项目 check-agent-environment 与 verify-governance。

本轮未提交或推送 Git，未对现有业务项目自动应用迁移，未部署或发布。
