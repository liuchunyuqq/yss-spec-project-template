---
name: yss-application
description: Use when implementing YSS application use cases, transaction boundaries, cross-aggregate orchestration, idempotency, or application-level DTO conversion.
---

# yss-application

Application 层用例编排 skill。负责协调 Domain 与 Gateway，定义事务边界和跨聚合流程，不承载核心领域规则。

## 何时使用

- 用户要实现 Application Service、用例编排或 `@Transactional` 边界。
- 用户要补 App 层 MapStruct Convertor 或跨聚合协调逻辑。
- 脚手架生成完成后进入业务实现，Router 按 `backend_impact` 加载本 skill。

## 不适用

- 只做领域建模时，优先 `yss-domain`。
- 只做持久层时，优先 `yss-repository`。
- 只做 Controller 时，优先 `yss-web-controller`。

## 工作方式

1. 先探测工程是新 DDD `application/domain/infrastructure/adapter` 还是 legacy `core/client/repository` profile。
2. 确认 Use Case、Application 边界、事务边界已在批准合同中写明。
3. 实现 AppService 时调用 Domain Service / Gateway，核心规则下沉 Domain。
4. 涉及 POJO 样板加载 `lombok`；涉及 App 层转换加载 `mapstruct`。
5. 详细包结构、注解、示例和 legacy 兼容说明见 `references/application-layer-guide.md`。
6. 涉及文件、对象存储或其他远程资源与数据库组合写入时，先明确调用、提交、立即补偿和持久化补偿任务的顺序；远程资源不与数据库共享本地事务。

## 产物范围

- `application/.../service/*Service.java`（或 legacy `core/service`）
- `application/.../service/impl/*ServiceImpl.java`
- `application/.../service/convertor/*Convertor.java`（MapStruct）

## 协同顺序

- 领域建模：`yss-domain`
- 持久层：`yss-repository`
- Web 适配：`yss-web-controller`
- DTO 契约：`yss-dto`

## 阶段 7 合同

- 只消费批准后的 `Slice Implementation Contract` 和当前 `work_unit`。
- AppService 骨架可 `controlled-generation`；用例编排、事务、幂等、远程资源补偿、权限和失败行为必须 `behavior-tdd`。
- 远程资源组合写入至少验证成功、数据库失败、立即补偿失败、补偿重试和幂等删除，并通过已确认的 Controller/Application/事务/资源适配器 seam 观察行为。
- 按 `yss-router/references/yss-skill-execution-result.md` 返回统一 `YSS Skill Execution Result`。
- 发现新 API、权限、状态机或跨上下文影响时填入 `new_impacts` 并暂停。

## 按需读取

- 分层开发规范：`references/application-layer-guide.md`
