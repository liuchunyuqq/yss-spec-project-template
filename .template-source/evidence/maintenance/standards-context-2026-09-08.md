# 实现前适用规范上下文维护记录

日期：2026-09-08。强度：L3（generation-semantics、core-validator）。日常维护使用维护者自检；未冻结发布候选、未发布或提交 Git。

## 范围与实现

权威修改位于 yss-spec-project-template，随后通过 canonical MVC 生成器的 export_plugin.mjs 同步到相邻插件仓库，source.json 路由保持不变。

共享解析器按工作单元合并工程基线、仓库规范、合同技能与影响面标准，索引直接 Markdown/YAML/JSON 和跨技能 references。合同、实现入口、恢复校验、checkpoint 和独立 Review 绑定同一有效集合；不新增人工批准阶段，不把摘要当作读取或语义正确性的证明。MVC 保留 Profile 排除规则，历史 v2 checkpoint 只读兼容，新任务明确启用扩展。

维护者自检：没有复制规范正文；没有把 review-only 全部转为 context-required；Reviewer 必须独立核对真实影响；缺少相关来源、篡改摘要、过期合同或工作单元不匹配不能进入扩展后的实现入口。缺陷仍按验收策略修复并针对性复查。

## 本轮验证

- `node --test scripts/applicable-standards.test.mjs scripts/acceptance-policy.test.mjs .agents/skills/yss-implementation-contract-compiler/tests/compiler-scenarios.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/generate_project.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/restore_environment.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs`：47/47 通过。
- 插件中的 `verify_plugin_integration.mjs <plugin-root>`：隔离导出、生成、真实 Git clone 恢复、38 个 MVC 技能、环境摘要一致、规范解析、基线变化拒绝旧摘要、同步漂移负例通过。实际 Agent 平台发现未验证。
- `node scripts/verify-yss-implementation-contract-compiler-scenarios`：通过。
- `node scripts/update-skill-lock --check`：通过。
- canonical `export_plugin.mjs --target <plugin-root> --check`：通过。
- 两个仓库 `git diff --check`：通过。

## 最终完整门禁

`node scripts/run-template-verification --profile fast` 因核心核验配置变化自动提升 release；最终退出码 0，输出 `模板核验通过（release）`。日志位于同目录 `standards-context-validation.log`（本地忽略文件）。这表示验证配置通过，不表示已经冻结、批准或发布维护候选。

本轮补齐锁定的 design-md 工具依赖与本机 Python jsonschema；保留严格 schema 校验。修复 Windows Node/Python shebang 执行、Python UTF-8、Maven shell 包装器和 CRLF 负例构造；修复重复技能注册、派生技能边界以及旧 MVC 别名扫描的精确兼容例外。v1 Matt 边界说明限定为历史解释，不恢复 v2 人工门禁。

最终插件导出一致性检查覆盖 335 个受管文件。隔离插件、真实 Git clone 恢复、项目 Git 干净、环境摘要一致及同步漂移负例通过，包含 38 个 MVC 技能；实际 Agent 平台发现仍未验证。本轮没有安装插件缓存、提交、推送或发布。

## 同步现场处理

首次导出发现已提交且工作区干净的插件内容与旧 mvc-source-manifest 不一致。核验整个插件目录 Git 状态干净后，以已提交内容重新建立同步基线，再执行正常导出；没有绕过未提交修改保护。最终 manifest 由导出器重新生成。

基座通用 sync-skills 在 Windows 上展开了 Git 链接投影。已仅恢复本轮生成的无关目录到原有已跟踪链接表示，保留实际规范对应的受管文件投影；两处无关换行变化也已恢复。未改相邻项目身份、源路由或插件安装缓存。
