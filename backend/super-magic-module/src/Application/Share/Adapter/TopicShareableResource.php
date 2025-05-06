<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\Share\Adapter;

use Dtyq\SuperMagic\Application\Share\DTO\ShareableResourceDTO;
use Dtyq\SuperMagic\Application\Share\Factory\Facade\ResourceFactoryInterface;
use Dtyq\SuperMagic\Application\SuperAgent\Service\WorkspaceAppService;
use Exception;

class TopicShareableResource implements ResourceFactoryInterface
{
    public function __construct(private readonly WorkspaceAppService $workspaceAppService)
    {
    }

    public function createResource(string $resourceId, string $userId, string $organizationCode): ShareableResourceDTO
    {
        // 先查询是否存在
        return new ShareableResourceDTO();
    }

    public function isResourceShareable(string $resourceId, string $organizationCode): bool
    {
        // 目前所有的话题都能够分享
        return true;
    }

    public function hasSharePermission(string $resourceId, string $userId, string $organizationCode): bool
    {
        // 目前没有分享权限
        return true;
    }

    public function getResourceContent(string $resourceId, string $userId, string $organizationCode, int $page, int $pageSize): array
    {
        $result = $this->workspaceAppService->getMessagesByTopicId((int) $resourceId, $page, $pageSize);
        if (empty($result)) {
            return [];
        }
        return $result;
    }

    public function getResourceName(string $resourceId): string
    {
        return $this->workspaceAppService->getTopicDetail((int) $resourceId);
    }

    public function getResourceExtendList(array $list): array
    {
        // 提取 resource_id, resource_id 是话题的 id
        $topicIds = array_column($list, 'resource_id');

        if (empty($topicIds)) {
            return $list;
        }

        // 通过 话题 id 集合，查询出工作区的名称和工作区的id
        try {
            $workspaceInfo = $this->workspaceAppService->getWorkspaceInfoByTopicIds($topicIds);
            // 通过 for 循环 将工作区的名称和工作区的id组装起来
            foreach ($list as &$item) {
                $resourceId = $item['resource_id'];
                $item['extend'] = [];
                if (isset($workspaceInfo[$resourceId])) {
                    $item['extend'] = [
                        'workspace_id' => $workspaceInfo[$resourceId]['workspace_id'] ?? '',
                        'workspace_name' => $workspaceInfo[$resourceId]['workspace_name'] ?? '',
                    ];
                }
            }
            return $list;
        } catch (Exception $e) {
            // 记录错误日志但不影响正常流程
            return $list;
        }
    }
}
