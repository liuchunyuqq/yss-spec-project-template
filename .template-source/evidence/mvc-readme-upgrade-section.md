### 4. 同步项目治理文件（无需重建脚手架）

插件升级不会自动更新已有项目。相邻 `skillUtils` 和项目内治理文件需要分别刷新；本次治理更新不需要重新生成 Java/POM 或运行 Maven 构建。

以下 PowerShell 命令可从任意目录执行。版本、marketplace、项目路径须替换为本机实际值。也可将 `$pluginRoot` 指向已同步的源码发行目录 `D:/localProject/yss-mvc-scaffold-generator/plugins/yss-mvc-scaffold-generator`。

```powershell
$pluginVersion = '1.2.0-rc.1' # 替换为实际已安装版本
$pluginRoot = Join-Path $env:USERPROFILE ".codex/plugins/cache/personal/yss-mvc-scaffold-generator/$pluginVersion"
$pluginScripts = Join-Path $pluginRoot 'skills/yss-mvc-scaffold-generator/scripts'
$projectRoot = 'D:/work/analysis-service' # 替换为已有 MVC 工程

# 升级共享技能并保留旧目录备份
node "$pluginScripts/restore_environment.mjs" --project-root $projectRoot --upgrade --dry-run
if ($LASTEXITCODE -ne 0) { throw '环境预演失败，先处理诊断' }
node "$pluginScripts/restore_environment.mjs" --project-root $projectRoot --upgrade
if ($LASTEXITCODE -ne 0) { throw '环境升级失败，保留现场' }
node "$pluginScripts/restore_environment.mjs" --project-root $projectRoot --check
if ($LASTEXITCODE -ne 0) { throw '环境一致性检查失败' }

# 预演项目内治理文件迁移，有定制冲突时停止并逐项合并
node "$pluginScripts/migrate_governance.mjs" --project-root $projectRoot --dry-run
if ($LASTEXITCODE -ne 0) { throw '迁移有冲突或失败，不能强制覆盖' }
```

核对预演中的 `changes` 后，在同一 PowerShell 会话执行：

```powershell
node "$pluginScripts/migrate_governance.mjs" --project-root $projectRoot --apply
if ($LASTEXITCODE -ne 0) { throw '治理迁移未完成' }
node "$pluginScripts/migrate_governance.mjs" --project-root $projectRoot --dry-run
if ($LASTEXITCODE -ne 0) { throw '治理迁移复查失败' }
# 最后一次结果应为 changes: []、conflicts: []
```

`skillUtils` 备份由输出的 `backup` 返回；治理备份位于项目 `.yss/governance-backup-*`。治理迁移仅更新白名单规则和工具，不迁移业务代码，不覆盖定制冲突。共用同一 `skillUtils` 的其他工程会看到新版技能，但各工程内的治理文件仍需分别迁移。

### 5. 恢复需求开发或初始化新 checkpoint

让开发 Agent 重新读取项目入口和共享技能后继续需求。已有错误 checkpoint 应依据 schema 修复并重验，保留切片、阻塞和证据；不要删除后重新初始化，不要只换摘要来复用陈旧证据。

只有尚未创建 checkpoint 的新需求，在从真实资料整理出带稳定 AC ID 的 Spec 后，才执行：

```powershell
node "$projectRoot/scripts/init-acceptance-checkpoint.mjs" --project-root $projectRoot --goal '实际用户目标' --baseline 'docs/.scratch/feature/spec.md' --output 'docs/.scratch/feature/checkpoint.yaml'
if ($LASTEXITCODE -ne 0) { throw '初始化失败，先按错误说明修复' }
node "$projectRoot/scripts/verify-lifecycle-checkpoint" "$projectRoot/docs/.scratch/feature/checkpoint.yaml"
```

工具计算真实摘要并拒绝覆盖已有文件。初始化通过不等于实现合同或业务验收通过，后续仍须执行项目登记的门禁。
