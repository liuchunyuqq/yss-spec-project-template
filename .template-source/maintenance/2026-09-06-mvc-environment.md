# MVC 外置环境恢复：实施与验证记录

日期：2026-09-06。范围：基座 MVC skill 维护及 MVC 插件同步。维护强度 L3，触发项为 generation-semantics、cross-repo-contract、aggregate-behavior-change；本轮采用维护者 self-check。

## 仓库与状态

- 基座：D:/yss/yss-spec-project-template，dev，基线 7b851bad453fd0d3a66461ed1372f7c31ba337ee。
- 插件：D:/yss/yss-mvc-scaffold-generator，main，基线 948bcc8ff923d5d3c841af579abc4ec3b109986e。
- 两个仓库开始时工作树干净。本轮未提交、推送、发布或重装本机插件。临时集成测试仓库中的 commit 仅为 Git clone fixture。
- 源码与专项集成已落实；基座统一快速门禁未通过，不能宣称整体 implementation-ready 或 release-ready。业务 Spec、OpenAPI、Ticket、Java 行为实现和前端为本轮 not-applicable：本轮维护机械生成及环境恢复工具。

## 具体变更

MVC skill 内新增 restore_environment.mjs，支持 --project-root、--dry-run、--check、--upgrade。新建与恢复共用 mvc-environment.mjs；恢复不调用项目初始化，不改 Java、POM、Git、CONTEXT、Spec 或 Ticket。

环境清单生成 38 个有效 skills，包括 4 个 MVC 专属实现适配：yss-application、yss-repository、yss-web-controller、yss-mybatis。DDD/前端基座源 skill 未修改；MVC 适配只存在于 MVC skill 的 assets 下。先生成有效 canonical 内容，再生成六个平台投影、有效锁、文件完整性清单、MVC Profile 副本和有效路由注册表。

编译合同与生命周期技能路由按 MVC Profile 适配，保留审批、版本、证据、Ticket 就绪约束。MVC Registry 通过 validateSkillRegistry 的锁与生命周期闭包验证。未验证真实业务 Slice 从需求到发布的端到端流程，不把文件生成测试当成业务契约批准证据。

早期项目没有 governance_profile 时，必须同时具备 project-instance 身份及合法 MVC 生成清单（schema、skill、project_instance、backend_root、固定六模块）。通过后消费外部生成的 MVC Profile，不改写项目。旧 yss-router 仅在有效注册表中作明确兼容别名；旧合同 schema/digest 仍需迁移审查。

已有未受管目录、无完整性基线的旧 skillUtils 或本地内容漂移不覆盖。受管版本变化只显式更新；首次安装和更新采用 staging，更新保留备份，失败恢复原版本。并发安装使用受管锁目录。

插件 source.json 默认使用相邻基座路径，支持 SourceRepository 覆盖。基座 export_plugin.mjs 按 MVC 生成依赖清单同步，mvc-source-manifest.json 记录 316 个受管文件。删除量较大主要来自插件此前分发的非 MVC skills 和旧平台投影；不是删除业务项目代码。基座 sync-skills 同时纠正了 5 个已有平台投影与 canonical 的差异，未手工修改这些投影或 DDD 源规则。

## 实际验证

Node v24.14.0，Windows。测试使用完整 TEMP/TMP 路径，避免 Windows 8.3 短路径与 Git 返回的长路径产生字符串比较误差。

| 命令或场景 | 本轮结果 |
|---|---|
| node --test .agents/skills/yss-mvc-scaffold-generator/scripts/generate_project.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/restore_environment.test.mjs | 一轮完整 24/24 通过（18 新建 + 当时 6 恢复）；随后追加早期项目兼容测试 |
| node --test .agents/skills/yss-mvc-scaffold-generator/scripts/restore_environment.test.mjs | 最终兼容代码 7/7 通过，覆盖早期生成清单正反例 |
| node .agents/skills/yss-mvc-scaffold-generator/scripts/verify_plugin_integration.mjs ../yss-mvc-scaffold-generator/plugins/yss-mvc-scaffold-generator | 最终代码通过；插件复制到临时独立目录后生成、结构验证、真实 Git clone、缺失环境恢复、仓库干净、环境 digest 相同及同步负例均通过 |
| node scripts/sync-skills --check | 通过 |
| node scripts/update-skill-lock --check | 通过 |
| 插件 scripts/sync-from-source.ps1 -Check | 通过，316 个受管文件一致 |
| plugin-creator/scripts/validate_plugin.py <插件根> | 通过；PyYAML 仅安装在临时验证目录，未改项目或系统依赖 |
| 两个仓库 git diff --check | 通过；仅有 LF/CRLF 提示 |
| 生成环境 validateSkillRegistry(registry, {lock, lifecycleContract}) | 通过：38 个共享有效技能、0 个平台私有技能、active |

复跑集成命令从基座根执行。集成脚本不依赖开发者个人绝对路径，运行时 fixture 位于临时目录，退出后清理。

机械生成采用可执行 Node 行为场景验证，不编写 Java 业务 TDD。Java/POM 模板本轮未变，未重新下载 Maven 依赖或宣称 Maven 全量业务测试通过。

## 统一门禁阻塞与边界

1. scripts/verify-template-fast 及其 Node 入口实际执行失败：Cannot read properties of undefined (reading 'trim')。Windows 下 run-template-verification 第 104 行直接 spawnSync 无扩展名 scripts/repository-mode；第 105 行未处理 spawn 错误时 stderr 为 null 的情况。未修改通用验证框架规避检查。
2. node scripts/verify-skill-registry 失败：重复 skill id: yss-mvc-scaffold-generator。原始 HEAD 的 docs/agents/yss-skill-registry.yaml 已含两个相同 ID，当前位于第 549、561 行；这是基座既有问题。本轮 MVC 有效注册表不分发创建期生成器，无此重复。
3. 本轮未执行完整发布门禁，不批准发布。基座门禁问题需在后续维护中修复，再重跑快速/完整门禁。
4. FILES_READY 仅表示恢复及文件校验。实际 Codex/其他 Agent 自动发现尚未实机验证，本机已安装 1.1.1 缓存也未替换。
5. 旧 skillUtils 无 MVC 完整性基线时保留现场；可在另一个父目录 clone 后恢复缺失环境。不能据安装成功自动批准旧业务合同或覆盖旧项目资产。

## 使用入口

插件根下进入 skills/yss-mvc-scaffold-generator，执行：

```powershell
node scripts/restore_environment.mjs --project-root D:\work\analysis-service --dry-run
node scripts/restore_environment.mjs --project-root D:\work\analysis-service
node scripts/restore_environment.mjs --project-root D:\work\analysis-service --check
```

已有受管版本确需更新时，先预演差异，再显式加 --upgrade。业务项目只消费相邻 skillUtils；维护修改仍先回基座，再同步插件。

## 回滚与后续

Git 回滚点为上述两个基线 commit；未创建 Git checkpoint。仅回滚本轮文件，保留后续用户修改。运行期升级备份由命令结果中的 backup 指定，不自动删除备份。后续先修复基座统一门禁，再按维护者决定更新发行版本和发布；插件安装发现验证单独执行。
