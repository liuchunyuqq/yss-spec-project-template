# Checkpoint v2 初始化与恢复修复

日期：2026-09-09。模板源维护 L3（生命周期入口、生成与跨仓库合同）。状态：implementation-ready；源代码、平台投影与完整模板核验通过，尚未发布插件。

原因：开发 Agent 自行构造不符合 schema v2 的记录；校验正确拒绝后，Agent 将自身格式错误当作业务阻塞。此前只覆盖脚手架结构和恢复，未覆盖需求 checkpoint 初始化入口。

变更：新增 scripts/init-acceptance-checkpoint.mjs，消费项目身份、策略、真实 Spec AC ID 和文件摘要，使用项目 schema/语义校验后排他创建；不覆盖原文件，不生成虚假验收或合同。生命周期 canonical skill 指向入口，开发门禁文档和错误输出指引保留原进度、修复重验后继续。MVC 新建、插件发行输入和治理迁移白名单纳入入口。

TDD seam 为 CLI 与真实校验器：新增入口缺失时 RED，实施后 GREEN。初始化/生命周期 8/8；迁移恢复 10/10；临时插件导出 350 文件并通过新工程 Spec→checkpoint→校验器、真实 Git 克隆恢复、摘要一致与漂移反例。未运行 Maven：此次未改 Java/POM 或业务运行行为。未修改 RBC、插件安装缓存或外部插件仓库，未提交推送。

维护者自检：不覆盖已有进度；拒绝越界与无 AC 基线；初始化不放行未 validated 的实现合同；坏记录继续非零退出并提供恢复步骤。测试不能保证所有 Agent 都遵循提示；本轮新增的是确定性入口与实际生成工程入口回归。

同步：首次 node scripts/sync-skills 请求被自动审批服务以 429 Too Many Requests/retry limit 拒绝。用户明确同意重试后执行成功，102 个共享技能完成同步。插件仓库仍需后续受控导出与发布升级，新入口不会自动出现在已安装 1.2.0-rc.1。

复盘：schema 校验只能发现坏产物，不能替代正确创建入口和自主修复流程。将需求初始化纳入插件隔离验证，避免再次仅凭脚手架可生成就宣称真实需求入口已覆盖。

最终模板核验：同步前因投影未同步退出 1；同步后重新执行 fast，按影响自动升级 release，退出 0。最新完整日志见 [checkpoint-initialization-verification.log](checkpoint-initialization-verification.log)。未提交、推送或发布。
