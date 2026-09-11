# MVC 类型布局治理修订

用户授权：维护基座并同步插件；RBC 和相邻 skillUtils 只读，不提交、不发布、不编辑全局插件缓存。

维护强度 L3：lifecycle-gate、generation-semantics、cross-repo-contract、historical-important-escape。
执行 maintaining-skills、diagnosing-bugs、tdd、codebase-design 的维护、反例和公开 seam 验证规则。

## 切片

1. 规则与 AST：单一机器规则、基础包配置、注解与继承职责、目录一致性、合同计划。
2. 闭环与推广：实现/完成门禁、规范恢复、摘要失效、Review、生成/升级受管清单、插件同步。

用户要求额外独立 Review；日常维护使用聚焦审查，不伪造正式发布候选或历史通过记录。实现者 root，独立审查者单独子 agent。每个切片和最终集成范围都需审查。

## 已执行 RED

`node --test scripts/mvc-package-layout.test.mjs`，退出码 1：带 RestController 注解的 Endpoint 位于 server.rbc，旧检查返回空错误列表，断言失败。修复后相同命令退出码 0。

## 设计判断

规则粒度、合同冲突、机器检查和独立 Review 同时补齐。职责不能只看名称；对语法无法证明的 DTO 和处理类，要求合同语义而非通用包兜底。静态分析不冒充依赖字节码解析，显式记录不确定性。
基础包消费既有 `.yss/scaffold-generation.json#base_package`。不扫描数据库，无 SQL 变更。Maven 仅在临时生成样本执行，RBC 保持只读。

原有未跟踪 `.template-source/evidence/mvc-readme-upgrade-section.md` 不属于本任务，保留。
