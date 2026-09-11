# RBC 只读审计

项目：C:/project/gshw-new/yss-datamiddle-report-filling

执行命令：

~~~powershell
node scripts/verify-mvc-structure.mjs --project-root C:/project/gshw-new/yss-datamiddle-report-filling --policy-root . --audit-all
~~~

退出码 1（预期：样本存在历史问题），不是工具回归失败。按新版维护源规则检查 57 个实际生产类型，共 54 条诊断。

| 分类 | 条数 |
|---|---:|
| mvc.layout.plan | 39 |
| mvc.layout.convertor | 1 |
| mvc.layout.entity | 4 |
| mvc.layout.mapper | 4 |
| mvc.layout.configuration | 2 |
| mvc.layout.controller | 2 |
| mvc.layout.advice | 1 |
| mvc.layout.schedule | 1 |

mvc.layout.plan 的 39 条为语法无法独立确定职责的类型，需要补充受审查的布局语义，不等同于已确定目录违规。旧项目未附新版生成样例语义提示，因此也包括旧脚手架 DTO、Gateway 和执行器。其余 15 条是可由注解/继承确定职责的布局违规。

- mvc.layout.convertor: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcConvertor.java role=convertor package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.convertor[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.entity: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcFilingEntity.java role=entity package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.entity[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.mapper: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcFilingMapper.java role=mapper package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.mapper[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.entity: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcMailEntity.java role=entity package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.entity[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.mapper: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcMailMapper.java role=mapper package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.mapper[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.entity: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcManagerEntity.java role=entity package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.entity[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.mapper: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcManagerMapper.java role=mapper package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.mapper[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.entity: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcSummaryEntity.java role=entity package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.entity[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.mapper: file=repository/src/main/java/com/yss/datamiddle/reportfilling/repository/rbc/RbcSummaryMapper.java role=mapper package=com.yss.datamiddle.reportfilling.repository.rbc expected=com.yss.datamiddle.reportfilling.repository.mapper[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.configuration: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcConfiguration.java role=configuration package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.configuration[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.controller: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcController.java role=controller package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.controller[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.advice: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcExceptionAdvice.java role=advice package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.advice[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.controller: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcOperationsController.java role=controller package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.controller[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.schedule: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcReminderSchedule.java role=schedule package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.schedule[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则
- mvc.layout.configuration: file=server/src/main/java/com/yss/datamiddle/reportfilling/server/rbc/RbcReminderSchedule.java role=configuration package=com.yss.datamiddle.reportfilling.server.rbc expected=com.yss.datamiddle.reportfilling.server.configuration[.<feature>] reason=实际类型职责、包或 Maven 模块不符合规则

初次审计前后 320 文件摘要全部一致。交付前再次比较，发现 .idea/workspace.xml 已发生变化（本任务没有写入该文件）；业务、治理、历史合同与审查资产摘要仍一致。完整观察保留在 rbc-later-observation.json 与 rbc-summary.json。本任务命令仅只读访问 RBC，未修改相邻 skillUtils 或全局插件缓存，未执行 RBC 业务代码迁移。
