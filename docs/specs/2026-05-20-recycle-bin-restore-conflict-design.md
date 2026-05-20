# 回收站文件恢复冲突交互设计

- 创建日期：2026-05-20
- 范围：`super-magic-module` / 回收站文件恢复（`File` 类型）
- 关联文件：
  - `src/Domain/RecycleBin/Service/RecycleBinRestoreDomainService.php`
  - `src/Application/RecycleBin/Service/RecycleBinAppService.php`
  - `src/Application/RecycleBin/DTO/*`
  - `src/Interfaces/RecycleBin/Facade/*`（控制器）

## 1. 背景与目标

当前 `RecycleBinRestoreDomainService::restoreFile` 在面对两类异常状态时采用**静默兜底**：

- 父级目录不存在或被永久删除 → 直接抛异常导致整次恢复失败
- 目标位置存在同名文件/目录 → 静默生成 `name(1).ext`、`name(2).ext` … 直至找到空位

这两种策略的共同问题是：**用户没有感知，操作不可控**。用户无法选择"还原到根目录"或"覆盖同名"，更无法察觉重命名结果。

本设计的目标：

1. **冲突显式化**：把"父级缺失"和"同名冲突"两类冲突明确暴露给前端
2. **用户主导**：所有冲突由用户选择如何解决，后端不再自作主张
3. **冲突即阻塞**：只要存在未解决的冲突，该 resource 一定不恢复——没有"默认通过""自动兜底""建议性容忍"等任何隐含行为
4. **批量友好**：一次性返回所有冲突，调用方一次性回填策略
5. **简化代码**：去除自动加 `(n)` 后缀的全部逻辑

## 2. 现状代码问题

```php
// src/Domain/RecycleBin/Service/RecycleBinRestoreDomainService.php

private function restoreFile(RecycleBinEntity $entity, string $userId): void
{
    // ...
    $targetParentId = $this->resolveRestoreParentId($entity, $file);   // 父级缺失直接抛
    $targetName = $this->resolveRestoreFileName($file, $targetParentId); // 静默加 (n)
    // ...
}

private function resolveRestoreFileName(/* ... */): string { /* 静默重命名 */ }

private function generateUniqueFileNameInParent(/* ... */): string { /* 试 1~20 后缀 */ }
```

**需要清理**：

- 删除 `resolveRestoreFileName`
- 删除 `generateUniqueFileNameInParent`
- 删除 `resolveRestoreParentId`（其职责合并进重写后的 `restoreFile`）
- 重写 `restoreFile`，接受冲突解决策略

## 3. 设计方案

### 3.1 API 形态

采用两阶段端点设计，与现有 `POST /api/v1/recycle-bin/check-parent` 模式保持一致：

| 端点 | 方法 | 用途 |
|---|---|---|¡
| `/api/v1/recycle-bin/restore/preview` | POST | 检测冲突，无副作用 |
| `/api/v1/recycle-bin/restore` | POST | 执行恢复，事务内重检 |

**preview 的语义**：

- 接受任意 `resource_type`，对未实现冲突检测的类型（Workspace / Project / Topic）一律返回 `items_no_conflict = 全部 ids` + `items_with_conflict = []`
- 本期仅实现 `File` 类型的检测逻辑
- preview 调用与否**不影响 restore 的阻塞性**：前端可选择不调（直接 restore，有冲突就 failed），也可以先调用拿到冲突清单再带策略调 restore。preview 只是"提前预知冲突避免一次往返"，不是"获得放行许可"

**restore 的语义**：

- 是否传 `conflict_resolutions` 都可调用，向后兼容
- 事务内重检冲突：
  - 无冲突 → 正常恢复
  - 有冲突且策略匹配 → 按策略执行
  - 有冲突但策略缺失 → 该 resource 归入 `failed`，不阻塞其它 resource

### 3.2 preview 请求 / 响应

**请求 DTO（`RestorePreviewRequestDTO`）：**

```json
{
  "resource_ids": ["100", "101", "102"],
  "resource_type": 5
}
```

**响应 DTO（`RestorePreviewResponseDTO`）：**

```json
{
  "items_with_conflict": [
    {
      "resource_id": "100",
      "resource_name": "report.docx",
      "is_directory": false,
      "conflict": {
        "type": "parent_missing",
        "original_parent_id": "200"
      }
    },
    {
      "resource_id": "101",
      "resource_name": "imgs",
      "is_directory": true,
      "conflict": {
        "type": "name_conflict",
        "existing_file_id": "999",
        "existing_is_directory": true
      }
    }
  ],
  "items_no_conflict": [
    { "resource_id": "102", "resource_name": "test.txt" }
  ]
}
```

**关键字段说明：**

- 每个 item 的 `conflict` 是**单一对象**，不是数组。preview 阶段父级缺失与同名冲突**互斥**：父级都没了，原位置同名检测就没意义；父级存在时才检测同名。
- `name_conflict` 仅返回必要的对手信息（`existing_file_id`、`existing_is_directory`），目标 parent 就是 `file.parent_id`，前端可通过 `resource_id` 自行回查。
- 如果用户选 `restore_to_root` 后，到根目录又遇到同名 → 那是 **restore 阶段才会出现的新冲突**，由 restore 内部按已传 resolution 处理；策略缺失就归 failed，前端再发起一轮 preview/restore 即可。


### 3.3 restore 请求

**复用并扩展现有 `RestoreRequestDTO`：**

```json
{
  "resource_ids": ["100", "101", "102"],
  "resource_type": 5,
  "conflict_resolutions": {
    "100": {
      "parent_missing": "restore_to_root",
      "name_conflict": "overwrite"
    },
    "101": {
      "name_conflict": "overwrite"
    }
  }
}
```

**字段说明：**

- `conflict_resolutions` 是**可选**的 map，key = `resource_id`
- 每个 resource 下按冲突类型组织策略
- 没传 = 该 resource 没有任何冲突解决意图，遇到冲突一律 failed

**响应保持现有 `RestoreResponseDTO` 结构**（succeeded / failed 列表）。

### 3.4 冲突策略枚举

新建 `Dtyq\SuperMagic\Domain\RecycleBin\Enum\RestoreConflictType` 和 `RestoreConflictResolution`：

```php
enum RestoreConflictType: string
{
    case ParentMissing = 'parent_missing';
    case NameConflict = 'name_conflict';
}

enum RestoreConflictResolution: string
{
    case RestoreToRoot = 'restore_to_root'; // parent_missing only
    case Overwrite = 'overwrite';            // name_conflict only
    case Skip = 'skip';                      // both
}
```

**有效组合**：

| 冲突类型 | 可用策略 |
|---|---|
| `parent_missing` | `restore_to_root`、`skip` |
| `name_conflict` | `overwrite`、`skip` |

**`overwrite` 语义**：

- 直接对目标位置的同名记录调用 `taskFileRepository->softDelete($existingFileId)`（**只删自身**）
- 目录被覆盖时**不递归处理子文件**，子文件的 `parent_id` 保持指向已被软删的旧目录，从用户视角不可见，从数据视角是孤儿，是接受的代价
- 被删除的旧文件**不进入当前用户的回收站**，避免产生"还原 A 又写入回收站一个同名 B"的循环困扰

**关键约束（阻塞性）**：

- 一旦检测到冲突，**任何缺失的策略一律导致该 resource 归入 `failed`**——不会"凑合恢复"。
- restore 阶段若发现 preview 之外的新冲突（典型：用户选了 `restore_to_root` 落到根目录后又同名），同样按此规则：传了对应策略则继续，没传则 failed。

## 4. 核心流程

### 4.1 preview 流程（针对单个 `File` resource）

```text
1. 通过 recycleBinRepository->findLatestByResourceIds 拿到回收站记录
2. 用 taskFileRepository->getByIdWithTrash 取出 file 实体
3. 若 file 不存在 / 已硬删 / 回收站记录 removed_at|purged_at 非空 →
   归入 items_no_conflict（restore 时会自然 failed，但 preview 不阻止前端调用）
4. 目标 parent_id 就是 file.parent_id（不读 extra_data，不做任何 fallback 推算）
5. 检测 parent_missing：
   - file.parent_id 为 null/0 → 视为合法根级，进入步骤 6
   - 否则用 getByIdWithTrash 查父级；不存在 / 已被软删 / 非目录 →
     报 parent_missing，本 resource 处理结束（不再检测同名）
6. 父级正常 → 检测 name_conflict：
   - 用 getByProjectParentAndName(project_id, file.parent_id, file.file_name) 查
   - 存在且 file_id 与自身不同 → 报 name_conflict
7. 有冲突 → items_with_conflict；无冲突 → items_no_conflict
```

**说明**：parent_missing 和 name_conflict 在 preview 阶段**互斥**——父级都没了，原位置同名检测毫无意义；只有父级存在时才检测同名。根目录 id 不在此阶段查询，推迟到 restore。

**性能优化**：批量 preview 时按 project_id 分组聚合查询，避免 N+1。

### 4.2 restore 流程（重写后的 `restoreFile`）

```text
事务开始
  1. 校验回收站记录状态（removed_at / purged_at）→ 失败抛异常
  2. 取 file（含软删除）→ 不存在 / 已硬删 → 抛异常
  3. file 未被软删 → 仅清理回收站记录返回
  4. 取出该 resource 的 resolution（来自 conflict_resolutions[resource_id]）

  5. 解析目标 parent_id（就用 file.parent_id，不读 extra_data）：
       a. 若 file.parent_id 为 null/0 → targetParentId = null（根级），跳过 parent 校验
       b. 否则用 getByIdWithTrash 校验：父级不存在 / 被软删 / 非目录 → parent_missing
          - resolution.parent_missing == 'restore_to_root' →
              查根目录：root = findRootDirectoryByProjectId(file.project_id)
              若 root 不存在 → 抛异常（归 failed）
              targetParentId = root.file_id
          - resolution.parent_missing == 'skip' 或缺失 → 抛异常（归 failed）
       c. 父级正常 → targetParentId = file.parent_id

  6. 校验同名冲突：getByProjectParentAndName(project_id, targetParentId, file.file_name)
       - 不存在 / 是自身 → 无冲突
       - 存在且非自身 → name_conflict（可能是 preview 见过的，也可能是
         restore_to_root 落到根目录后才浮现的"新冲突"，统一处理）
          - resolution.name_conflict == 'overwrite' →
              taskFileRepository->softDelete(existing.file_id)（仅删自身，不递归子）
          - resolution.name_conflict == 'skip' 或缺失 → 抛异常（归 failed）

  7. 调 taskFileRepository->restoreFile(file_id)
  8. 重新加载 restored entity，更新 parent_id / file_name / updated_at
  9. 若 targetParentId 非 null 且 > 0，对其 metadata_version + 1
  10. 删除回收站记录
事务提交
```

**关键**：步骤 6 的"事务内重检"是阻塞性的——preview 没看见但 restore 看见的新冲突（典型是 `restore_to_root` 后根目录又同名），策略缺失就 failed，不会"凑合恢复"。

### 4.3 批量恢复的失败容忍

`restoreBatch` 保持现有"逐 resource 独立处理 + 部分成功"语义：单个 resource 抛异常被捕获、归入 `failed`，不影响其它 resource。

## 5. 数据模型与接口

### 5.1 新增 DTO

- `Application/RecycleBin/DTO/RestorePreviewRequestDTO`
- `Application/RecycleBin/DTO/RestorePreviewResponseDTO`
- `Application/RecycleBin/DTO/RestorePreviewItemDTO`
- `Application/RecycleBin/DTO/RestoreConflictDTO`

### 5.2 修改 DTO

- `RestoreRequestDTO` 增加 `conflict_resolutions` 字段（可选 map）

### 5.3 新增 Enum

- `Domain/RecycleBin/Enum/RestoreConflictType`
- `Domain/RecycleBin/Enum/RestoreConflictResolution`

### 5.4 修改 Domain Service

`RecycleBinRestoreDomainService`：

- 删除 `resolveRestoreFileName`、`generateUniqueFileNameInParent`、`resolveRestoreParentId`
- 重写 `restoreFile`：直接基于 `file.parent_id` + `conflict_resolutions` 解析最终 `targetParentId`，按"先 parent_missing 后 name_conflict"顺序检测冲突，缺策略即抛
- 新增 `previewFileConflicts(array $resourceIds, string $userId): array`
- `restoreSingle` / `restoreBatch` 签名增加 `conflict_resolutions` 参数透传

### 5.5 修改 App Service

`RecycleBinAppService`：

- 新增 `previewRestore(RequestContext, RestorePreviewRequestDTO): RestorePreviewResponseDTO`
- `restore` 方法增加从 DTO 读取 `conflict_resolutions` 并向下传递

### 5.6 新增 Controller 路由

复用 `RecycleBinApi` 类（或对应控制器），新增 `previewRestore` 方法绑定 `POST /api/v1/recycle-bin/restore/preview`。

### 5.7 Repository 接口

需要确认 `TaskFileRepositoryInterface` 是否已有：

- `softDelete(int $fileId): void` — 不递归，仅设置自身 `deleted_at`（用于 overwrite）
- `findRootDirectoryByProjectId(int $projectId): ?TaskFileEntity` — 已存在 ✓
- `getByIdWithTrash(int $fileId): ?TaskFileEntity` — 已存在 ✓
- `getByProjectParentAndName(int $projectId, ?int $parentId, string $fileName): ?TaskFileEntity` — 已存在 ✓

若 `softDelete` 不存在则需要补充。

## 6. 关键决策记录

| # | 决策 | 选择理由 |
|---|---|---|
| 1 | 两阶段端点（preview + restore） | 与 `checkParent` 一致；preview 无副作用便于复用与缓存；接口语义纯粹 |
| 2 | 一次性返回所有冲突 + 一次性回填策略 | 批量场景下避免 N+1 交互；UI 一个弹窗统一选择 |
| 3 | preview 支持所有 resource_type | 接口签名统一；非 File 类型本期占位返回空，便于未来扩展 |
| 4 | preview 可选调用 | 不影响阻塞性（restore 阶段无论如何都会重检并对未解决冲突 failed）；调 preview 只是前端体验优化，避免"先 restore 失败再回查冲突"的多余往返 |
| 5 | `name_conflict` 仅 overwrite/skip，**取消 rename** | 简化策略；自动 `(n)` 后缀让用户无感知，违背"显式化"目标 |
| 6 | `overwrite` 不递归删子 | 用户明确要求；接受孤儿子文件作为代价 |
| 7 | `overwrite` 被删的旧文件不入回收站 | 还原是主动行为，覆盖是预期副作用；避免"循环回收"困扰 |
| 8 | preview 只如实反映当前状态，不做 fallback 模拟；根目录 id 推迟到 restore 阶段查询 | 保持 preview 逻辑简单；parent_missing 与 name_conflict 互斥，符合用户原始需求；根目录同名只在 restore 阶段才有意义 |
| 9 | 冲突即阻塞 — 任何未给策略的冲突一律 failed | 严格遵循"用户主导"原则；杜绝隐式兜底；不阻塞批次其它无冲突项 |
| 10 | 策略颗粒度 = per-resource × per-conflict-type | 单 resource 在 restore 阶段可能同时撞两类冲突（先 parent_missing 后 name_conflict），需独立决策 |

## 7. 兼容性

- `RestoreRequestDTO` 新增字段为可选 → 老调用方无 `conflict_resolutions` 仍可工作（有冲突项归 failed，无冲突项正常恢复）
- 当前测试用例若依赖"自动加 (n) 后缀"行为 → 需同步调整
- 前端如果不消费 preview 接口 → 直接调 restore 失败时拿到 failed 原因，可作为兜底体验

## 8. 测试要点

- 新增 PHPUnit 用例：
  - preview：父级缺失 / 同名 / 无冲突 各场景；验证两种冲突在 preview 阶段互斥
  - restore + resolution：`restore_to_root`、`overwrite`、`skip`、单一/复合策略
  - **关键场景**：parent_missing + 选 restore_to_root + 根目录又同名
    - 同时传 `name_conflict: overwrite` → 成功
    - 未传 `name_conflict` → failed（验证阻塞性）
  - 事务重检：preview 后状态变更（父级被别人删 / 目标位置新增同名）的容错
  - 批量部分失败：3 项中 1 项缺策略，验证另外 2 项仍恢复
  - 占位语义：非 File 类型 preview 返回结构正确
- 不需要 UI 集成测试（前端独立实现）

## 9. 后续扩展

- 未来 `Topic` / `Project` 同名/移动冲突复用同一 preview/restore 协议，只需在 Domain Service 增加对应 `preview*Conflicts` 实现
- `RestoreConflictResolution` 可在不破坏 API 的前提下增加新策略

## 10. 受影响代码清单

| 文件 | 动作 |
|---|---|
| `Application/RecycleBin/DTO/RestorePreviewRequestDTO.php` | 新增 |
| `Application/RecycleBin/DTO/RestorePreviewResponseDTO.php` | 新增 |
| `Application/RecycleBin/DTO/RestorePreviewItemDTO.php` | 新增 |
| `Application/RecycleBin/DTO/RestoreConflictDTO.php` | 新增 |
| `Application/RecycleBin/DTO/RestoreRequestDTO.php` | 修改：增加 `conflict_resolutions` |
| `Domain/RecycleBin/Enum/RestoreConflictType.php` | 新增 |
| `Domain/RecycleBin/Enum/RestoreConflictResolution.php` | 新增 |
| `Domain/RecycleBin/Service/RecycleBinRestoreDomainService.php` | 重写 `restoreFile`；新增 `previewFileConflicts`；删除 `resolveRestoreFileName`、`generateUniqueFileNameInParent`、`resolveRestoreParentId`；`restoreBatch`/`restoreSingle` 增加 `conflict_resolutions` 参数 |
| `Application/RecycleBin/Service/RecycleBinAppService.php` | 新增 `previewRestore`；`restore` 透传 resolutions |
| `Interfaces/RecycleBin/Facade/*Api.php`（控制器） | 新增 `previewRestore` 路由 |
| `config/routes.php`（或对应路由配置） | 新增 `POST /api/v1/recycle-bin/restore/preview` |
| `storage/languages/{zh_CN,en}/recycle_bin.php` | 新增 conflict 相关错误信息 |
| `tests/Unit/Domain/RecycleBin/Service/RecycleBinRestoreDomainServiceTest.php` | 新增/更新测试 |

## 11. 实施期核对清单（非设计歧义）

以下条目在写代码时直接按描述执行即可，不影响设计本身：

- 在 `TaskFileRepositoryInterface` 中确认/补充 `softDelete(int $fileId): void`（不递归，仅设置自身 `deleted_at`）。若已有等效方法直接复用。
- 路由前缀与控制器注册位置以仓库现状为准（沿用 `RecycleBinApi` 的注册方式）。
- preview 不返回父级名称（`original_parent_name`）；前端如有展示需求自行通过其它接口补查。
