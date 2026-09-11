# MVC Java 类型职责与包布局治理交付

## 结论与方案校正

用户方案中的问题成立，已先修订基座 yss-spec-project-template，再通过既有导出链同步 yss-mvc-scaffold-generator 插件源码。基座完整门禁、相关回归、生成/恢复/升级、隔离插件集成及独立 Review 通过。Java Maven 编译验收仍受本机内部仓库配置与缓存限制，不能声称编译通过或发布就绪。

实施时补充了原方案未细化的边界：

- 使用既有 `.yss/scaffold-generation.json#base_package`，不从目录推断。
- 兼容基础包根的 SpringBootApplication，以及无 Java 源文件的空模块，不为目录完整生成空包。
- 不确定的 DTO/Processor 需要合同语义；注解、本地继承和元注解信号不能被虚假声明覆盖。
- 合同嵌入规范 bundle 时，只冻结布局子合同与写入边界，避免全文摘要循环引用。
- 多切片使用各片开始前的签名快照，允许前片代码尚未提交；整体验收仍核对需求初始快照的全部变化。
- 仅计划验证、只读历史解析、全量审计不能替代正式 AST 检查回执。

## 维护源与用途

下列路径均相对基座根，插件对应文件由导出脚本生成，不分别维护。

| 维护源 | 用途 |
|---|---|
| docs/process/mvc-package-layout.yaml | 唯一可版本化规则、职责信号、模块、技术职责包、启动入口兼容范围 |
| docs/process/mvc-governance-profile.yaml | Profile 固定引用包布局规则 |
| docs/process/schemas/mvc-type-layout.schema.json | 结构化布局计划 schema |
| scripts/lib/mvc-package-layout.mjs | 规则解析、合同校验、职责识别、Git 变化、实际源码布局核验、跨片合并 |
| scripts/lib/java/MvcAst.java、scripts/lib/mvc-structure.mjs | 延用 JDK AST，增加 package/owner/注解类型及方法/字段信号，接入布局核验 |
| scripts/verify-mvc-structure.mjs | 正式结构门禁、编码前 plan-only、只读 audit-all 和 historical 模式 |
| scripts/lib/development-gate.mjs、implementation-contract-compiler.mjs | 实现前真实合同校验、合同新鲜度、整体快照范围与合并布局核验 |
| scripts/lib/applicable-standards.mjs、execution-evidence.mjs | MVC 固定加载、恢复时校验当前布局、规则及检查器变化使证据失效 |
| docs/process/mvc-package-layout.md、implementation-standards-context.md | 使用、恢复、升级与历史兼容说明 |
| docs/templates/review-report-template.md、.agents/skills/code-review/references/yss-review-standards.md | 独立从实际代码/diff 核对职责、包与登记，区分 violation/suggestion |
| .agents/skills/yss-mvc-scaffold-generator/assets/mvc-skills/*/SKILL.md | 四份 MVC 专属技能引用统一规则，未复制整套规则 |
| .agents/skills/yss-implementation-contract-compiler/SKILL.md、yss-mvc-scaffold-generator/SKILL.md | 条件化消费与生成入口说明 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/lib/scaffold-layout.mjs、generate_project.mjs | 为新生成样例记录源码摘要绑定的职责提示，仅供未变样例审计使用 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/lib/governance-migration.mjs | 将新规则、schema、校验器、使用说明纳入既有受管升级清单 |
| scripts/mvc-package-layout.test.mjs、docs/process/template-verification-profiles.yaml | 正负向回归及模板门禁接入 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/verify_plugin_integration.mjs | 脱离基座的生成、审计、clone 恢复、摘要刷新及漂移检测 |
| skills-lock.json、各平台投影；插件 mvc-source-manifest.json | 使用既有工具刷新技能锁和生成映射/内容摘要 |

## 六模块最终布局

以下全部相对基础包；`[.<feature>]` 表示允许业务子包，规则原文仍以机器文件为准。

| 模块 | 职责包 |
|---|---|
| server | server.controller、server.schedule、server.advice、server.configuration、server.security，均允许业务子包；SpringBootApplication 入口允许基础包根或 server 根 |
| core | core.service（接口）、core.service.impl（实现）、core.gateway、core.policy、core.model，均允许业务子包 |
| client | client.request、client.query、client.response，均允许业务子包 |
| repository | repository.entity、repository.mapper、repository.convertor，均允许业务子包 |
| adapter | adapter.database、adapter.oracle、adapter.oceanbase（数据库执行）；adapter.mock；adapter.integration（外部集成）；adapter.file；adapter.configuration，均允许业务子包 |
| feign-client | feign.client（远程接口）、feign.configuration，均允许业务子包；Maven 模块保持 feign-client |

## 实际验证

| 命令/范围 | 结果 | 证据 |
|---|---|---|
| `node --test scripts/mvc-package-layout.test.mjs`，独立 Reviewer 重跑 | 11/11；初始 Controller 反例先 RED 后 GREEN | final-review.md |
| 布局、development-gate、execution-evidence、applicable-standards、mvc-structure 联合测试 | 28/28 | regression-tests.txt |
| generate_project、restore_environment、migrate_governance 三套测试 | 28/28 | generator-tests.txt |
| `node scripts/run-template-verification --profile fast` | 因核心核验资产变化自动升级 release，最终退出码 0 | template-verification-final.txt |
| `scripts/sync-from-source.ps1` 与 `-Check` | 同步成功，356 个受管文件一致 | 插件 mvc-source-manifest.json |
| `node .../verify_plugin_integration.mjs .../plugins/yss-mvc-scaffold-generator` | 隔离插件、真实 clone 恢复、工作树不变、环境摘要一致及负向漂移全部通过 | plugin-integration-final.txt |
| 临时生成样例 `verify-mvc-structure.mjs --audit-all` | 退出码 0 | 临时样例源及 mvc-scaffold-layout.json |
| 临时样例 `mvnw.cmd -B package` | 退出码 1；YSS_MAVEN_REPOSITORY_URL 未提供，父 POM 解析失败 | maven-package.txt |
| 临时样例 `mvnw.cmd -o -B package` | 退出码 1；内部仓库所需父 POM 未缓存 | maven-offline-package.txt |
| RBC 新规则只读全量审计 | 退出码 1，预期报告历史问题 | rbc-audit.md、rbc-audit.txt、rbc-summary.json |

Maven 使用的临时项目为 `C:/Users/15540/AppData/Local/Temp/mvc-layout-qa-20260911/project`。未修改 settings、填入猜测的仓库地址或跳过测试。若后续提供可用内部 Maven 环境，可在该样例直接重跑 Wrapper。此次 Java 修改仅涉及治理 AST 辅助程序，已由所有 AST 测试实际 javac 编译执行；这不等同于完整业务工程 Maven 构建。

## 独立 Review 闭环

初审报告 slice-review.md 与最终报告 final-review.md 分开保留。实施者 root、Reviewer 为独立子 agent。F1 非完整检查替代、F2 跨片重复/键序误报、F3 嵌套继承漏识别、F4 摘要依赖缺失、F5 多切片未提交范围污染，均完成修复和独立复验。最终两个切片和整体结论 pass，没有未关闭 violation。该审查不伪装为发布批准。

## RBC 诊断与边界

扫描 57 个实际生产类型，54 条诊断：15 条可确定的布局违规（Controller 2、Advice 1、Schedule 1、Configuration 2、Entity 4、Mapper 4、Convertor 1），39 条职责待明确。后者也包含没有新版样例提示的旧脚手架类，不应当作 39 条确定目录违规。

初次审计前后 320 文件摘要一致；交付前再次核对仅 `.idea/workspace.xml` 已改变，本任务未写该文件。业务源码、合同、checkpoint 和 Review 等治理资产仍保持原摘要。详细观察见 rbc-audit.md。未执行 RBC 业务代码迁移，未修改相邻 skillUtils，未修改用户全局插件缓存，未 commit、push、发布或部署。

## 升级与历史兼容

正式维护成果位于两个源码仓库。已有项目按插件的 migrate_governance.mjs 先 dry-run，再经既有 apply 机制升级；保留备份，用户定制冲突不覆盖。skillUtils 用 restore_environment.mjs 的既有升级入口消费发行源。本任务未对 RBC 执行升级应用。

旧合同/checkpoint/Review 保留原文；历史布局解析返回 legacy-readable 且 compliant=false。新任务须使用新规则，恢复旧任务时补充当前变化范围的布局计划、规范上下文及新检查证据。只读全量审计不触发历史文件自动搬迁。规则、基础包、布局计划或检查器依赖变化后刷新摘要、重跑验证和独立审查。
