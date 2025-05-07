<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Persistence;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskFileRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Model\TaskFileModel;
use Exception;
use Hyperf\DbConnection\Db;

class TaskFileRepository implements TaskFileRepositoryInterface
{
    public function __construct(protected TaskFileModel $model)
    {
    }

    public function getById(int $id): ?TaskFileEntity
    {
        $model = $this->model::query()->where('file_id', $id)->first();
        if (! $model) {
            return null;
        }
        return new TaskFileEntity($model->toArray());
    }

    /**
     * 根据fileKey获取文件.
     */
    public function getByFileKey(string $fileKey): ?TaskFileEntity
    {
        $model = $this->model::query()
            ->where('file_key', $fileKey)
            ->first();

        if (! $model) {
            return null;
        }
        return new TaskFileEntity($model->toArray());
    }

    /**
     * 根据话题ID获取文件列表.
     *
     * @param int $topicId 话题ID
     * @param int $page 页码
     * @param int $pageSize 每页数量
     * @param array $fileType 文件类型过滤
     * @return array{list: TaskFileEntity[], total: int} 文件列表和总数
     */
    public function getByTopicId(int $topicId, int $page, int $pageSize, array $fileType = []): array
    {
        $offset = ($page - 1) * $pageSize;

        // 构建查询
        $query = $this->model::query()->where('topic_id', $topicId);

        // 如果指定了文件类型数组且不为空，添加文件类型过滤条件
        if (! empty($fileType)) {
            $query->whereIn('file_type', $fileType);
        }

        // 过滤已经被删除的， deleted_at 不为空
        $query->whereNull('deleted_at');

        // 先获取总数
        $total = $query->count();

        // 获取分页数据
        $query = $query->skip($offset)
            ->take($pageSize)
            ->orderBy('file_id', 'desc');

        $result = Db::select($query->toSql(), $query->getBindings());

        $list = [];
        foreach ($result as $item) {
            $list[] = new TaskFileEntity((array) $item);
        }

        return [
            'list' => $list,
            'total' => $total,
        ];
    }

    /**
     * 根据任务ID获取文件列表.
     *
     * @param int $taskId 任务ID
     * @param int $page 页码
     * @param int $pageSize 每页数量
     * @return array{list: TaskFileEntity[], total: int} 文件列表和总数
     */
    public function getByTaskId(int $taskId, int $page, int $pageSize): array
    {
        $offset = ($page - 1) * $pageSize;

        // 先获取总数
        $total = $this->model::query()
            ->where('task_id', $taskId)
            ->count();

        // 获取分页数据
        $query = $this->model::query()
            ->where('task_id', $taskId)
            ->skip($offset)
            ->take($pageSize)
            ->orderBy('file_id', 'desc');

        $result = Db::select($query->toSql(), $query->getBindings());

        $list = [];
        foreach ($result as $item) {
            $list[] = new TaskFileEntity((array) $item);
        }

        return [
            'list' => $list,
            'total' => $total,
        ];
    }

    /**
     * 为保持向后兼容性，提供此方法.
     * @deprecated 使用 getByTopicId 和 getByTaskId 代替
     */
    public function getByTopicTaskId(int $topicTaskId, int $page, int $pageSize): array
    {
        // 由于数据结构变更，此方法不再直接适用
        // 为保持向后兼容，可以尝试查找相关数据
        // 这里实现一个简单的空结果
        return [
            'list' => [],
            'total' => 0,
        ];
    }

    public function insert(TaskFileEntity $entity): TaskFileEntity
    {
        $date = date('Y-m-d H:i:s');
        $entity->setCreatedAt($date);
        $entity->setUpdatedAt($date);

        $entityArray = $entity->toArray();
        $model = $this->model::query()->create($entityArray);

        // 设置数据库生成的ID
        if (! empty($model->file_id)) {
            $entity->setFileId($model->file_id);
        }

        return $entity;
    }

    /**
     * 插入文件，如果存在冲突则忽略.
     * 根据file_key和topic_id判断是否存在冲突
     */
    public function insertOrIgnore(TaskFileEntity $entity): ?TaskFileEntity
    {
        // 首先检查是否已经存在相同的file_key和topic_id的记录
        $existingEntity = $this->model::query()
            ->where('file_key', $entity->getFileKey())
            ->where('topic_id', $entity->getTopicId())
            ->first();

        // 如果已存在记录，则返回已存在的实体
        if ($existingEntity) {
            return new TaskFileEntity($existingEntity->toArray());
        }

        // 不存在则创建新记录
        $date = date('Y-m-d H:i:s');
        $entity->setCreatedAt($date);
        $entity->setUpdatedAt($date);

        $entityArray = $entity->toArray();

        try {
            $model = $this->model::query()->create($entityArray);

            // 设置数据库生成的ID
            if (! empty($model->file_id)) {
                $entity->setFileId($model->file_id);
            }

            return $entity;
        } catch (Exception $e) {
            // 如果在尝试创建时出现异常（如唯一键冲突），再次查询尝试获取
            $existingEntity = $this->model::query()
                ->where('file_key', $entity->getFileKey())
                ->where('topic_id', $entity->getTopicId())
                ->first();

            if ($existingEntity) {
                return new TaskFileEntity($existingEntity->toArray());
            }

            return null;
        }
    }

    public function updateById(TaskFileEntity $entity): TaskFileEntity
    {
        $entity->setUpdatedAt(date('Y-m-d H:i:s'));
        $entityArray = $entity->toArray();

        $this->model::query()
            ->where('file_id', $entity->getFileId())
            ->update($entityArray);

        return $entity;
    }

    public function deleteById(int $id): void
    {
        $this->model::query()->where('file_id', $id)->delete();
    }

    public function getByFileKeyAndSandboxId(string $fileKey, int $sandboxId): ?TaskFileEntity
    {
        $model = $this->model::query()
            ->where('file_key', $fileKey)
            ->where('sandbox_id', $sandboxId)
            ->first();
        if (! $model) {
            return null;
        }
        return new TaskFileEntity($model->toArray());
    }
}
