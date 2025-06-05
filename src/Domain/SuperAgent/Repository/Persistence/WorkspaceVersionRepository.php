<?php

declare(strict_types=1);

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Persistence;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WorkspaceVersionEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\WorkspaceVersionRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Model\WorkspaceVersionModel;

class WorkspaceVersionRepository implements WorkspaceVersionRepositoryInterface
{
    public function create(WorkspaceVersionEntity $entity): WorkspaceVersionEntity
    {
        $model = new WorkspaceVersionModel();
        $model->fill([
            'id' => $entity->getId(),
            'topic_id' => $entity->getTopicId(),
            'sandbox_id' => $entity->getSandboxId(),
            'commit_hash' => $entity->getCommitHash(),
            'dir' => $entity->getDir(),
            'created_at' => $entity->getCreatedAt(),
            'updated_at' => $entity->getUpdatedAt(),
            'deleted_at' => $entity->getDeletedAt(),
        ]);
        $model->save();
        $entity->setId($model->id);
        return $entity;
    }

    public function findById(int $id): ?WorkspaceVersionEntity
    {
        $model = WorkspaceVersionModel::query()->find($id);
        if (!$model) return null;
        return $this->toEntity($model);
    }

    public function findByTopicId(int $topicId): array
    {
        $models = WorkspaceVersionModel::query()->where('topic_id', $topicId)->get();
        $entities = [];
        foreach ($models as $model) {
            $entities[] = $this->toEntity($model);
        }
        return $entities;
    }

    private function toEntity($model): WorkspaceVersionEntity
    {
        $entity = new WorkspaceVersionEntity();
        $entity->setId((int)$model->id);
        $entity->setTopicId((int)$model->topic_id);
        $entity->setSandboxId((string)$model->sandbox_id);
        $entity->setCommitHash((string)$model->commit_hash);
        $entity->setDir((string)$model->dir);
        $entity->setCreatedAt($model->created_at ? (string)$model->created_at : null);
        $entity->setUpdatedAt($model->updated_at ? (string)$model->updated_at : null);
        $entity->setDeletedAt($model->deleted_at ? (string)$model->deleted_at : null);
        return $entity;
    }
}
