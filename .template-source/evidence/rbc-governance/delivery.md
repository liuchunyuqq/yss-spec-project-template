# RBC 治理完善实施交付记录

日期：2026-09-09。结论：本轮治理代码、生成迁移与有界回归已通过独立审查；未发布，RBC 业务未完成。用户目前无需准备公钥或配置环境。

## 实施结果

- 基座增加精确验收 ID 与反向完整性检查、需求来源摘要和规则/场景追踪、真实模块与候选写入范围校验、OpenAPI 内容与 GET/POST 等列表查询行来源合同。
- MVC 增加 JDK AST 生产依赖检查，覆盖继承、组合和静态 Mock 引用、Entity/MP、Service 接口及实现、Controller 服务依赖、统一 Wrapper 与必要注释。复杂查询 XML 保留合法入口。
- 验证计划区分静态、契约、单元、Mock、数据库与审查能力。实际执行回执绑定命令、环境摘要、候选输入、退出码和执行器；完成校验拒绝陈旧、手写或缺少必需检查的证据。无 HEAD 项目也可捕获候选基线。
- 独立审查回执要求可信宿主签名事件；普通子进程自称 reviewer 不能通过。协议夹具使用测试密钥，不代表真实宿主已接入。
- 生成器输出 Service 接口及实现，修正 PageResult 泛型与分页工厂参数，增加 HTTP 分页断言。治理脚本纳入生成、迁移、备份、冲突保护和幂等链路。
- canonical 技能、锁文件和投影已同步；插件受控导出 349 文件，版本为本地候选 `1.2.0-rc.1`；共享 `C:/project/gssr/skillUtils` 已升级并通过复查。

## 最新验证

| 检查 | 实际结果与证据 |
|---|---|
| 治理回归 | 15/15 通过；精确引用、路径、API、证据、AST、分型验证计划与完成门禁 |
| 独立审查 | R1–R6 均关闭，无剩余 finding；见 [review.md](review.md) |
| 完整模板核验 | fast 根据影响自动升级 release，退出 0；见 [template-verification.log](template-verification.log) |
| 插件导出与隔离集成 | 349 文件一致；真实 Git 克隆恢复、干净工作树、摘要一致及漂移反例通过；见 [plugin-integration.log](plugin-integration.log) |
| 迁移及恢复 | 独立审查运行 10/10 通过，覆盖备份、冲突保护与幂等 |
| 新建 Mock 工程 | 临时工程 Maven `package` 七模块通过，HTTP 测试 1/1；见 [mock-http-test.txt](mock-http-test.txt) |
| DTO 真实依赖 | 使用 javap 检查本地实际 DTO jar 的 Wrapper 和分页工厂公开签名，并由上述 HTTP 测试检查分页 JSON |
| RBC 只读复诊 | 原门禁退出 1；新版拒绝缺失/陈旧合同和证据；见 [rbc-diagnosis.json](rbc-diagnosis.json) |

模板验证临时使用 bundled Python，并在系统临时目录安装 jsonschema/PyYAML；没有修改项目依赖。Maven 使用用户已有 settings，不复制其中内容。

## 回归矩阵边界

- G01–G04、G06、G08、G13、G15–G17：治理工具正反例通过。
- G05：Entity/MP 静态检查通过，实际写入落地仍需数据库行为证据。
- G07：Wrapper 静态反例与新建工程 HTTP 分页通过，不替代 RBC HTTP 验收。
- G09–G12、G14、G18–G20：本轮不修改 RBC 业务，未执行对应业务验收。来源/身份合同检查不能替代服务端权限测试。
- G21：新建、隔离克隆恢复、升级/重复升级及定制冲突保护已验证。实际 RBC 升级只执行 dry-run，5 个定制治理文件冲突被保留，没有覆盖业务工程。

RBC 的 AST 扫描被现有 Controller Java 语法错误中断；诊断中的空 findings 不表示结构检查通过。业务持久化、重启、事务、报送、催收、ZIP 和汇总行为仍须另行实施并验证。

## 迁移与剩余工作

共享环境自动备份位于 `C:/project/gssr/.skillUtils.backup-1788934389836`。实际 RBC dry-run 冲突为 `docs/process/development-gate.md`、`scripts/verify-development.mjs`、`scripts/verify-java-web.mjs`、`scripts/lib/development-gate.mjs`、`scripts/lib/java-web-style.mjs`；需在后续允许修改 RBC 的范围内逐项合并，不能强制覆盖。

真实审查宿主适配器尚未接入，Agent 发现仍为 `not-verified`。这是工具接入工作，当前不要求用户提供密钥。OpenAPI 检查是明确边界的内容校验，不能宣称完整标准一致性验证；AST 不证明反射、动态工厂和实际 Spring Bean 接线正确。执行回执本地 HMAC 不能防御同权限攻击者重建全部本地状态，行为能力仍需独立审查与实际环境验证。

本轮未提交、推送、发布或修改安装缓存；完整模板检查成功不等于外部 `create-yss-spec` 发布集成验证完成。应完成真实宿主接入、外部发布集成及 RBC 业务验收后，再作相应完成或发布结论。

## 复盘

初始正例全部通过仍遗漏反向 AC 完整性、环境变化、静态 Mock 调用、具体 Service 注入、非法 schema 类型和 POST 查询。独立审查提供反例后逐项修复，并保留回归。权威开发门禁文档已补充验证计划、候选基线、回执和信任边界；今后不能用实现者自述、Mock 或签名测试夹具替代独立运行及数据库证据。
