# MVC 类型布局独立复查

Reviewer: mvc-layout-reviewer；implementer: root。scope: slice 1、slice 2、整体治理工具实现。result: pass；未关闭 findings: []。此结论只覆盖下列候选源码与规则，不代表生成业务工程已完成 Maven 编译、已安装全局插件或已发布。

candidate_digest: 741fd757442df865b0076bd8dede702231c247def53f3ae289b628fd6b145df8
standards_digest（机器布局规则 SHA-256）: b19c00c5afac23aa1e21c8a382a672a95e5fece0ecf7ca0a1a452357933d456a

## 验收与切片裁决

切片 1 pass：职责/模块/包/路径单一规则、基础包配置、合同计划、注解与项目继承/元注解 AST、多类型文件及 Application 受限例外已核对。切片 2 pass：实现前门禁、正常 AST 必需检查、规范恢复、证据失效、签名切片范围与整体遗漏检查、生成/迁移受管清单和 Review 文档闭环已核对。整体 pass：已发现 F1–F5 全部关闭，未发现新的可复现阻断缺陷。

## Finding 修复过程

- F1：初审发现 --plan-only / --historical / --audit-all 可替代完整 AST；修复为 Node 与精确 argv。fresh 门禁回归确认三种参数均被拒绝。
- F2：初审 union 重复误报；第一次修复仍因 JSON 键序不同误判冲突；最终 mergeLayoutTypes 规范化键序，同语义去重，真正职责差异仍报冲突。独立反例与回归均通过。
- F3：初审相对 Outer.Base 漏识别；第一次复查补发现同一 Outer 中 Child extends Base、包星号导入后的 Outer.Base 漏识别；最终沿 owner 词法作用域与 wildcard 路径解析。独立 Node 反例均正确识别 entity，实际 Java AST 回归通过。
- F4：初审缺少 CLI、mvc-structure 与 schema 输入摘要；最终自动冻结这些执行语义文件，规则/检查变化使旧回执失效。
- F5：复查发现前片未提交 dirty 文件污染后片单片检查；最终 CLI 使用 mvc_structure.baseline_snapshot_ref 的签名差异，门禁验证快照，多片要求引用。checkPackageLayout 同时强制覆盖当前计划；completion 继续使用独立的整体初始签名快照加全部计划合并检查遗漏，未将单片快照作为整体豁免。fresh 回归覆盖前片未提交、本片未登记拒绝和签名篡改拒绝。
- 开发中 schema URL 参数类型错误已修复为 fileURLToPath。合同内嵌 standards bundle 的自引用摘要已改为冻结 mvc_structure/allowed_write_paths；fresh 恢复测试确认 current。

以上 findings 来自实际规则与行为要求，均为 defect / violation；未将个人目录偏好设为硬门禁。初审保留在 slice-review.md。

## 实际验证

独立执行 node --test scripts/mvc-package-layout.test.mjs：exit 0，11/11 pass。独立 Node ESM 对此前 F2/F3 原始反例重新运行：exit 0，同语义不同键序可合并，冲突仍拒绝，词法成员父类及 wildcard 嵌套父类均识别 entity。

检查实际源码中的 CLI → changedSinceBaseline → checkMvcStructure/checkPackageLayout 和 completion → 整体签名基线 → mergeLayoutTypes 链路；检查生成器 recordScaffoldLayout、迁移受管清单、隔离插件集成脚本及工程规范/Review 文档。签名范围回归经公开函数链路执行，未单独手建完整 completed checkpoint 重跑 CLI 端到端；主控最终集成验证须保持 fresh。

已读取主控先前证据：generator-tests.txt 28/28 pass；plugin-integration.txt 隔离导出、真实 Git clone 恢复、环境摘要、同步漂移反例通过；template-verification.txt 为 release 通过。这些是证据复核而非本人重跑；主控正在重新同步和执行最终验证，最后导出字节与本报告源码候选的对应关系由其同步检查确认。

## 环境限制

Maven online 因 YSS_MAVEN_REPOSITORY_URL 缺失失败；offline 因 Spring Boot parent 缓存缺失失败。不能声称生成工程已编译或生产运行验证通过。此限制未通过修改业务样本、历史合同、数据库、缓存或提交发布来规避。

## 候选 SHA-256

~~~json
{
  "docs/process/mvc-package-layout.yaml": "b19c00c5afac23aa1e21c8a382a672a95e5fece0ecf7ca0a1a452357933d456a",
  "docs/process/mvc-package-layout.md": "a92548ba16bf05d9d442dc9609c7c425d061a76a2780732d65b81660517d57ad",
  "docs/process/schemas/mvc-type-layout.schema.json": "75e12ddabc6210ec67172849a44bc9453bb87aa1da475d6a68ea0b6df0d14175",
  "docs/process/implementation-standards-context.md": "a0ccf312f2f2ba47952c0773111946817b23407c719c5d0272de2db464f88173",
  "docs/templates/review-report-template.md": "7703af178c77dcc23f9b19c7f806cadfa72fa5bc2b94c9022370989dc8dceac9",
  "scripts/lib/mvc-package-layout.mjs": "31288e88e900812f03c05843015ed95fe64e19a3c1832f3906e23c8f907e14ce",
  "scripts/lib/mvc-structure.mjs": "08479e10c66c90a9c498ab12513106f382baf25fbfc94cfc228386bd1e858021",
  "scripts/lib/java/MvcAst.java": "622893a2f2f79f9dd13d8fe308346a3df343842bee8bb963e8cb5f93acba02d0",
  "scripts/lib/development-gate.mjs": "a1d9efffa05b001657b90efa65769fe678f3648f1303678640e5998013750e96",
  "scripts/lib/execution-evidence.mjs": "a5dd6a9597b4744dfa992b851027b7f791af7b49435acecad018a8ea1e7331e6",
  "scripts/lib/applicable-standards.mjs": "0d70a54bc5eaea88efa6439bb0c2350a683d7ac913181e13247147d36d658008",
  "scripts/lib/implementation-contract-compiler.mjs": "fcd278734d3b351a5de48f30153784690b3cc4d833d888dd0dc584a4180e4907",
  "scripts/verify-mvc-structure.mjs": "8c82928bb02c3607ec3e8a85e492992a16e4733febc6345b6ff452f17e8d286d",
  "scripts/mvc-package-layout.test.mjs": "12833033c90ba3cfdb400a2b9a2399b5235a4a13545ebc37be9721b7435ad623",
  ".agents/skills/yss-mvc-scaffold-generator/scripts/generate_project.mjs": "99640c2e167469f40e1058547b6e37b2ea9821d256e3dff788bc203cefb30e7b",
  ".agents/skills/yss-mvc-scaffold-generator/scripts/lib/scaffold-layout.mjs": "d80235de04ca6c767a32b7732ae0758999b861153c1b2f2198228dd135ddb9b6",
  ".agents/skills/yss-mvc-scaffold-generator/scripts/lib/governance-migration.mjs": "b305f684df7fabc8990a45d4eb812794393fc8f773afe180f7e7eb093dd24e46",
  ".agents/skills/yss-mvc-scaffold-generator/scripts/verify_plugin_integration.mjs": "69d892c9b6ef19653adf794a58cfca682cea3913fa4a5ba82ebbfb084e674e44"
}
~~~

reviewer_id: mvc-layout-reviewer
审查结论: pass
