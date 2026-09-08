# MVC 治理修复记录

## 问题与边界

RBC 实例开发中，实施者跳过合同、数据模型、规范解析与独立审查，仅用跳过测试的打包作为结束依据。Profile 检查只验证声明，不能证明业务完成。用户要求在模板基座修复，再同步插件源仓库，由用户自行更新插件并重新生成项目。

本次不修复 RBC 业务代码，不修改用户安装缓存，不提交、推送或安装插件。模板源身份为 template-source，维护强度 L3，日常采用维护者自检；没有编造业务批准或独立审查记录。

## 改动与自检

- 身份清单接受合法的可选 governance_profile，仍拒绝未知字段与越界引用。
- 注册表校验按实例/模板源区分消费路径，不再要求实例拥有模板源专属文件。
- DTO 校验和默认合同编译通过锁文件定位外置技能；MVC 编译使用实际 MVC 能力注册表。
- 新增业务准入与完成 CLI，拒绝无 checkpoint、无规范上下文、缺合同、缺 Spec、缺命中数据/API 产物和缺必需检查的完成声明。
- 继续消费原有 checkpoint 的摘要、退出码、独立审查和验收覆盖检查；历史只读入口保留。
- 新增所有 Controller 的 Java Web/Javadoc 静态检查，登记为工程必需命令。
- 示例 Java 模板依据 fmt-maven-plugin 2.9.1 的实际输出调整；格式检查绑定 Maven validate，package 自动运行。
- 生成测试真实执行 Profile、注册表、DTO、Java Web、默认合同编译和无 checkpoint 的拒绝路径。

CLI 不是运行时强制调度器，不能阻止绕过 CLI 的自然语言完成声明。文件存在、摘要一致与静态检查也不能证明业务正确；主控仍须落实独立语义审查。没有新增人工批准步骤。

## 实际验证

2026-09-08，Windows、Node 24.14.1、项目 Maven Wrapper、Java 8。

- 业务准入/验收、旧验收策略、规范解析：19 个测试通过，退出码 0。
- 生成、克隆恢复、迁移：28 个测试通过，退出码 0。
- 模板 fast 核验因修改核心验证配置自动升级为 release，最终通过，退出码 0。
- 首次完整核验受沙箱 fixture 写入和 Python PATH 影响失败；补齐工具级权限和运行时后重新执行，通过。失败结果未作为验收证据。
- 全新生成的 governance-fresh 项目执行 mvnw.cmd -o -s 外部 settings package，通过六模块格式检查、编译、Mock HTTP 测试和打包；测试 1，失败 0，跳过 0。没有对该项目执行事后格式修复。
- 外部 settings 自带 blocked 标签和 yss-internal Profile 警告，不影响本次成功结果，未修改 settings。

完整模板日志保留在本机资源目录 governance-verification/template-verification.log。插件分发由官方 sync-from-source.ps1 生成，实际分发哈希由插件 mvc-source-manifest.json 持有；源 commit 只标识基线，不代表本次工作区修改已提交。

## 插件同步与交接

插件源仓库 yss-mvc-scaffold-generator 已通过官方同步脚本更新；最终 -Check 核对 340 个分发文件一致。verify_plugin_integration.mjs 在脱离基座的副本中通过生成、真实 Git 克隆恢复、环境摘要一致和同步漂移反例检查。Agent 实际重新加载由用户更新插件后新建任务验证，本次未冒充该项已完成。

官方 plugin-creator helper 更新清单为 1.1.1+codex.20260908094044，插件清单验证通过。清单验证首次因 bundled Python 缺少 PyYAML 失败，在资源目录临时 QA 依赖中补齐后复验通过，没有修改全局 Python。

最终基座完整核验包含本次维护 checkpoint，退出码 0；git diff --check 通过。源码修改保留为未提交工作区成果；未 push、未发布远程插件、未重装插件，也未修复当前 RBC 业务服务。用户后续更新所使用的插件来源后，应新建任务生成新项目验证。
