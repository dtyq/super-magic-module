<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Handler;

use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Dtyq\SuperMagic\Domain\RecycleBin\Repository\Facade\RecycleBinRepositoryInterface;
use Hyperf\DbConnection\Db;
use Throwable;

/**
 * 文件彻底删除处理器.
 *
 * 当前只将文件回收站记录标记为已移除，真正的文件/目录资源清理由后续定时任务完成。
 */
class FilePermanentDeleteHandler implements PermanentDeleteHandlerInterface
{
    public function __construct(
        private readonly RecycleBinRepositoryInterface $recycleBinRepository
    ) {
    }

    public function supports(RecycleBinResourceType $type): bool
    {
        return $type === RecycleBinResourceType::File;
    }

    public function handleBatch(array $recycleBinEntities): array
    {
        $failed = [];

        foreach ($recycleBinEntities as $entity) {
            try {
                Db::beginTransaction();

                $this->recycleBinRepository->markRemovedByIds([$entity->getId()], 'system');

                Db::commit();
            } catch (Throwable $e) {
                Db::rollBack();

                $failed[] = [
                    'id' => (string) $entity->getId(),
                    'resource_type' => $entity->getResourceType()->value,
                    'resource_id' => (string) $entity->getResourceId(),
                    'resource_name' => $entity->getResourceName(),
                ];
            }
        }

        return ['failed' => $failed];
    }
}
