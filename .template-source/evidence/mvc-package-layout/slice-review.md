# MVC 类型布局切片独立审查（初审）

Reviewer: mvc-layout-reviewer；implementer: root；scope: slice 1 + slice 2 已有接入；result: changes-required。候选仍在实现中，本报告不是最终整体放行。

切片 1：changes-required。切片 2：changes-required。

## Findings（均为 defect / violation，不是偏好建议）

- F1 / P1 / 切片 2：scripts/lib/development-gate.mjs 的 AST 必需检查只做 args.includes(script) 与 includes(contract_ref)。CLI 新增 --plan-only、--historical、--audit-all 成功分支未执行完整 checkMvcStructure。合同登记这些参数仍能满足必需 AST 检查并产生成功回执。completion 的 checkPackageLayout 仅补布局，不补 production-mock、service-interface、entity 等结构要求。必须约束为正常合同 AST 验证 argv，且核对根路径和真实执行程序。
- F2 / P2 / 切片 2：completion 将全部 types flatMap 合并后再 validateLayoutPlan；重复类型按 seen.has(type) 失败。两个依赖切片合法先后修改同一 Service 时，单片合同各自合法，整体却因相同计划重复被拒。需去重相同类型布局，检测不一致的冲突。
- F3 / P2 / 切片 1：identifyRoles.resolve 遇到任何含点名称立即当作 FQN，漏掉同包 Outer.Base、导入 Outer 后 Outer.Base 等合法相对嵌套类型。本项目继承图职责可退化成 unknown，再被合同任意语义掩盖。独立 Node 反例：classes 含 com.acme.core.model.Outer.Base（带 RestController），子类 extends Outer.Base，identifyRoles 返回 []。应解析嵌套作用域及外层显式 import。
- F4 / P2 / 切片 2：execution-evidence.checkInputs 自动冻结的布局输入未包括 verify-mvc-structure.mjs、mvc-structure.mjs 或新增 schema。业务合同 input_paths 仅源码时，实际验证入口或结构分析改变，旧成功回执仍可保持 current，违反检查器升级必须重新验证的要求。
- 开发中即时反馈：刚添加 schema 调用传入 URL 而 validateJsonSchema 接收字符串；当前独立调用报 paths[0] must be string。主控已收到，此为正在实现期间错误，最终须复验。

## 验证

- node --test scripts/mvc-package-layout.test.mjs：exit 0，1/1 pass（2026-09-11）。该测试只覆盖 Controller 改名不豁免，不能证明以上边界。
- Node ESM 独立对象反例（仅内存，不修改业务样本）：相对嵌套继承返回 []；尝试单片/合并计划被最新 schema URL 调用错误截断，因此 F2 依据实际合并及 seen 源码，需主控修复 schema 后补行为测试。
- 未执行 Maven、数据库、RBC 变更、提交或发布。

## 初审候选 SHA-256

~~~json
{
  "docs/process/mvc-package-layout.yaml": "5e68326f3835a197261c2fceba018c903dfb9ee4b47e6e737b2f4707ed44e00c",
  "scripts/lib/mvc-package-layout.mjs": "ab87530b1b9e556a60acd8bd95060dfdfcabacd7575f7a58bb72cf1b589e4782",
  "scripts/lib/mvc-structure.mjs": "08479e10c66c90a9c498ab12513106f382baf25fbfc94cfc228386bd1e858021",
  "scripts/lib/java/MvcAst.java": "622893a2f2f79f9dd13d8fe308346a3df343842bee8bb963e8cb5f93acba02d0",
  "scripts/lib/development-gate.mjs": "67d92905fd4dcad9a018d37bb188d7f1d2bea39e0d9c5dd7c6ff3d2152b82d21",
  "scripts/lib/execution-evidence.mjs": "27fbd5deb5dd22406c229da7fe1ee41c7102c017067d59b673a1514675bdd034",
  "scripts/lib/applicable-standards.mjs": "60789ae6e9a6d040d7e1ba983066525ed6803e715fa525599080ff50fa25ac3b",
  "scripts/lib/implementation-contract-compiler.mjs": "fcd278734d3b351a5de48f30153784690b3cc4d833d888dd0dc584a4180e4907",
  "scripts/verify-mvc-structure.mjs": "a38fa0e775be2a369b0653f48bd6f5626b0096dc344e8415b732548e9d0f463b"
}
~~~

当前候选变动后，修复必须复查。本报告不覆盖尚未完成的文档、生成、升级和插件同步。
