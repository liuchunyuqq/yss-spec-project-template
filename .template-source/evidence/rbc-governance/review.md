# RBC 治理独立审查

日期：2026-09-09。result：pass。scope：本轮通用合同、执行证据、MVC AST 检查、生成和迁移接线的代码审查。Reviewer：`/root/governance_review`，角色 `role.test-engineer`，执行态 Reviewer，runtime `runtime.skill-projection`；实施者 `/root`。这是宿主实际派发的独立 subagent；报告不冒充具有宿主签名的机器验收回执。未修改实现、测试或 RBC 源码。当前结论以第 3 轮复核为准；R1–R6 均已关闭，无未关闭代码 findings。此结论不等同于方案所有外部接入完成、插件发布或 RBC 业务验收通过。

## 第 3 轮最终复核

R6 已修复：数组成功响应的查询元数据校验覆盖全部 HTTP 方法；批量写入用显式 `x-operation-kind: mutation` 声明，由语义 Review 核实分类真实性。读取当前代码与正反例，实际运行 `node --test scripts/contract-integrity.test.mjs`，4/4 通过、退出 0，耗时 0.107 秒。额外独立构造 GET、POST、PUT、PATCH、DELETE 五种方法：缺查询合同均被拒绝，显式 mutation 例外均通过。

最新 `scripts/lib/contract-integrity.mjs` SHA-256：`56B97E70F3402EE194AECB97F1D53428D3D0E8DAFC1130B98E73B8948F16212C`。重新捕获其余 8 个审查文件摘要，全部与第 2 轮表格一致；前轮治理及迁移测试仍覆盖相同字节，没有以修改后的旧通过证据替代复验。

读取主控落盘证据：`plugin-integration.log` 报告隔离插件、真实 Git 克隆恢复、项目 Git 干净、环境摘要一致和同步负例通过，同时明确 agent_discovery=not-verified；`template-verification.log` 尾部为模板 release 核验通过；`mock-http-test.txt` 为 1 个 Mock HTTP 测试、0 失败/错误/跳过；`rbc-diagnosis.json` 保留来源摘要、legacy_exit_code=1，并列出新门禁对旧 RBC 的具体拒绝项。这些是主控执行证据的审查，不冒充 Reviewer 重跑全部命令。主控最终仍需保证日志属于最终投影/发布候选。

交付应分别陈述：治理代码及本轮有界回归已通过独立审查；实际宿主信任适配器未接入、Agent 客户端发现未验证；Mock HTTP 测试不证明 Oracle 持久化；RBC 仍为只读失败诊断对象，业务修复和真实数据库验收未完成。不能把工具代码审查通过扩大为整份方案全部完成或可发布。

## 第 2 轮复核

任务包 contract_version=2。已读取最新检查器、AST、templates.mjs、storage.mjs 和 governance-migration.mjs 的代码与 diff。

- R1：Spec 集合反向覆盖校验已接入，遗漏 AC-2 不能通过。
- R2：继承环境摘要和环境变量指向文件的内容摘要已接入；默认 Maven settings 摘要已接入。该保守策略会因不相关环境变化使旧证据失效，属于复验成本而非错误放行。
- R3：AST 加入静态方法调用、静态导入和方法引用。
- R4：Controller 的字段与参数依赖都覆盖 ServiceImpl。
- R5：非法 schema type 已拒绝。此手工结构校验仍应作为受限检查，不应宣称完整 OpenAPI 标准一致性证明。
- 生成模板改为 Service/Impl，Controller 消费接口、使用依赖中的 PageResult；storage 的 import 排序保持确定性。尚未把这里的源码审查当成真实 HTTP/数据库验收。
- 迁移保持固定文件白名单、dry-run、冲突时不应用、备份和二次升级幂等；旧业务代码不被覆盖。恢复环境检查受管摘要，保留本地漂移并支持失败回退。

### R6 [P2] POST 列表接口绕过行来源合同要求

位置：`scripts/lib/contract-integrity.mjs:129` 的 `method==='get'` 条件。对应方案 4.2、F06、G10–G12。

列表语义与 HTTP 方法无关，生成器自己的查询示例也使用 `POST /query`。独立复现将同一有数组成功响应、无 x-query-contract 的 operation 分别放在 get/post：GET 返回缺少列表查询合同错误，POST 返回 `[]`。因此真实 POST 列表可以不声明行来源、登录身份、事实缺失默认值及对应场景，准入仍通过。需要通过显式查询能力或契约标记识别查询列表，并覆盖 POST 查询；避免仅为修复而把所有批量写入响应无差别当作列表查询。

第 2 轮真实验证：任务包 14/14 通过，退出 0，耗时 16.76 秒；额外运行 `node --test .agents/skills/yss-mvc-scaffold-generator/scripts/migrate_governance.test.mjs .agents/skills/yss-mvc-scaffold-generator/scripts/restore_environment.test.mjs`，10/10 通过、退出 0，耗时 68.56 秒。一次独立读取工具因 runner spawn_ready 超时失败，重试读取成功，不算验证失败或成功证据。

当前剩余外部能力：真实宿主信任适配器尚未部署；测试使用测试专用签名密钥，只验证协议。真实 Oracle/OceanBase 数据库验收、RBC 行为修复、发布/安装缓存更新未在本审查中执行。插件隔离与临时工程 package 由主控同期执行，须消费其真实结果后作整体交付判断。

第 2 轮候选摘要：

| 文件 | SHA-256 |
|---|---|
| scripts/lib/development-gate.mjs | 505FBEDD3148F252D720F6174F6BFADC6F5496E668C080AE140E55069D6A4004 |
| scripts/lib/contract-integrity.mjs | 35D2BFD468B1A5F0A9BDFEAF4FE0C710D378B3D9DB82935C1B0F5E01F65D1E09 |
| scripts/lib/execution-evidence.mjs | 9C2C496AA109A6F7AA7DF9454F7D8EFB66AC90450DF73A3F37AD1872E46107B7 |
| scripts/lib/verification-plan.mjs | FA51FA235EB712FB86DB13A2DCC3F21E34B4C69802954A36982AAD3AEA7B6ABC |
| scripts/lib/mvc-structure.mjs | 10DD1BCDE5761D371E4691AD35FE767C44EA3B828AE64FAB6546DFEECCAC91D3 |
| scripts/lib/java/MvcAst.java | 62E64BDFEFC1FECF2B9ADBCED936E678CD68E34031EB269DEA76500DBCBD5E96 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/lib/templates.mjs | CA40B9E6344364B20A45B8911571D92A4B26AB478D23B6E0DE220BA6A7208246 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/lib/storage.mjs | BD4BF646C7EC12C89B52BCF1A50D95828DFD34B68984F90646E6B3EEB8C9ADD5 |
| .agents/skills/yss-mvc-scaffold-generator/scripts/lib/governance-migration.mjs | B206B57E5A99002FCA23770FB8DF4FEE49223CC3947E51C9DD6D6BA351B2D9C9 |

以下保留首轮发现与验证历史，相关 findings 已由上文关闭。

基线：`861603b3189b15ee08dcfdacade65359552d8b23`。消费方案、CONTEXT.md、任务包、code-review skill、development-gate 文档及实际代码。此轮不包含并行修改中的插件迁移实现审查；不宣布方案完成或可发布。

## Findings

### R1 [P1] Spec 验收可以从 checkpoint 和全部切片同时遗漏

位置：`scripts/lib/development-gate.mjs:47`–`50`。对应方案 G01、F08、F11。

当前只验证 checkpoint/切片 AC 属于 Spec，没有反向验证 Spec 全部范围内 AC 必须进入 checkpoint 和切片。独立复现：复制完整验收正例至系统临时目录，为 Spec 增加 AC-2，在 requirements.acceptance_ids、需求来源和场景中同时保留 AC-2，checkpoint、切片与 Review 仍只有 AC-1。实际 `validateDevelopmentGate(..., 'completion')` 返回 `[]`，测试退出 0。意味着需求已保留但没有任何切片或审查覆盖，仍可宣布完成。需要从权威验收集合验证全覆盖，并支持显式、有来源的范围外裁决。

### R2 [P1] 使用的环境变化后旧成功回执仍有效

位置：`scripts/lib/execution-evidence.mjs:39`–`46`、`68`。对应 G13、G15。

executionContext 只摘要出现在 argv `${ENV:...}` 中的变量；spawnSync 实际继承全部进程环境。独立复现：检查脚本读取 `REVIEW_DB`，A 时退出 0、B 时退出 1；执行器在 A 捕获成功后改成 B，`verifyExecutionReceipt` 仍返回 `[]`。真实数据库地址、Profile、JAVA_HOME 等通过环境配置的检查会复用不同环境的成功证据。需要显式环境输入声明、摘要和受控传入，至少保证所有检查所消费的环境进入一致性校验。外部 settings 路径摘要也不能代替文件内容摘要。

### R3 [P1] 静态调用 Mock 的生产实现漏报

位置：`scripts/lib/java/MvcAst.java:40`–`43`。对应 G04、F01。

AST 引用仅收集变量类型、new、extends/implements，不收集成员选择或静态方法调用。独立生成真实 Java 源 `OracleStore.save() { InMemoryStore.save(); }`，使用 parseJavaProject 后 OracleStore.refs 为 `[]`，指定 production_types=[p.OracleStore] 的 checkMvcStructure 返回 `[]`。这是可静态发现的直接依赖，并非反射或 Spring 动态装配边界。需要纳入静态调用、静态导入等依赖边。

### R4 [P2] Controller 直接注入 ServiceImpl 未被禁止

位置：`scripts/lib/mvc-structure.mjs:69`。对应 G08、F05。

Controller 字段检查只判断 dependency.simpleName.endsWith('Service')，而合法命名的具体类为 SaveServiceImpl，分支不会命中。独立构造 AST 模型，Controller 字段 SaveServiceImpl，后者实现 SaveService 接口，检查结果 `[]`。因此 Service 自身接口结构正确并不能证明 Controller 依赖接口。需要检查所解析到的业务服务具体类型，并覆盖构造器注入。

### R5 [P2] 非法 OpenAPI schema 类型被作为合法合同接受

位置：`scripts/lib/contract-integrity.mjs:99`–`106`。对应 G03、F10。

schema 只判断存在 type 等字段，不校验其值属于合法类型。独立输入 3.1.0 API，200 响应 schema.type='banana'，400 为 string，validateOpenApi 返回 `[]`。这样的契约不能被合法 schema 消费者使用。应消费版本对应 schema 验证，或补足明确支持的类型、结构边界并拒绝不支持的结构；不能把这一检查宣称完整 OpenAPI 校验。

## 已纠正的发现与边界

最初通过任意 Node 子进程输出伪造 reviewer/dispatch/host_event_ref 的 JSON，即可得到有效独立 Review。已及时通知主控。主控增加宿主公钥与签名事件验证后，已读取修改并重新运行任务包 14 项测试全部通过。新代码验证可信宿主事件比任意 stdout 有实质改进；但部署时信任配置必须由真实宿主建立，不能由实施者自行生成密钥及自签事件来宣布独立审查。签名无法证明同权限本地文件不可被整体重建。实际宿主适配器未就绪时仍应报告机器审查回执未完成。

## 实际验证

- 任务包命令 `node --test scripts/development-gate.test.mjs scripts/contract-integrity.test.mjs scripts/execution-evidence.test.mjs scripts/mvc-structure.test.mjs scripts/verification-plan.test.mjs`：初始及宿主签名修复后各运行一次，均 14/14、退出 0。最后一轮耗时 7.90 秒。
- R1 使用正例临时副本，只增加权威 Spec/来源/场景的 AC-2，未缩减原验收：输出 `OMITTED AC-2 COMPLETION: []`。
- R2/R4/R5 独立 Node 最小输入：分别输出 `changed used environment []`、`controller directly injects impl []`、`invalid schema accepted []`。
- R3 使用临时真实 Java 源并运行 JDK AST：输出两个类型 refs 都为 `[]`、结构检查 `[]`。
- 一次初始临时复现脚本存在括号语法错误，退出 1，纠正后才计入上述证据；未修改仓库测试。

## 候选文件摘要

SHA-256；以下绑定本次实际审查字节，相关修改后必须复核。

| 文件 | SHA-256 |
|---|---|
| scripts/lib/development-gate.mjs | 72D182E50E614B9046F8CA7F2445F158E1D0B068B9C436B47347586F6397AC24 |
| scripts/lib/contract-integrity.mjs | C679E9CAAC23A92F0D24E749773EAE5D8560C0AEA167688B940E56875206EFA2 |
| scripts/lib/execution-evidence.mjs | BF7EBBD495B955B8E05B80F300A2B8B79465B0B6B20B7AFBA4C09D09BDAF4F2B |
| scripts/lib/verification-plan.mjs | FA51FA235EB712FB86DB13A2DCC3F21E34B4C69802954A36982AAD3AEA7B6ABC |
| scripts/lib/mvc-structure.mjs | 4C0529E7F01F0EED3D8AFC56FC1ADA24DD6AFD58E5AD02993D84BC470009123A |
| scripts/lib/java/MvcAst.java | 3FA8850AEA15E971DD74800BBF9DFED55E0B6E64696075AE3A9D465FFD7C1C91 |

验收范围：G01–G08、G13、G15–G17 的工具能力。G09–G12、G14、G18–G20 业务行为没有执行，不声称通过；P4/G21 迁移与新建/恢复待主控其他证据及整体审查。RBC 不应获得业务完成结论。
