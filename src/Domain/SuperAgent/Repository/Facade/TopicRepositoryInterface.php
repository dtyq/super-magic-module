<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;

interface TopicRepositoryInterface
{
    /**
     * 通过ID获取话题.
     */
    public function getTopicById(int $id): ?TopicEntity;

    /**
     * 根据条件获取话题列表.
     * 支持过滤、分页和排序.
     *
     * @param array $conditions 查询条件，如 ['workspace_id' => 1, 'user_id' => 'xxx']
     * @param bool $needPagination 是否需要分页
     * @param int $pageSize 分页大小
     * @param int $page 页码
     * @param string $orderBy 排序字段
     * @param string $orderDirection 排序方向，asc 或 desc
     * @return array{list: TopicEntity[], total: int} 话题列表和总数
     */
    public function getTopicsByConditions(
        array $conditions = [],
        bool $needPagination = true,
        int $pageSize = 10,
        int $page = 1,
        string $orderBy = 'id',
        string $orderDirection = 'desc'
    ): array;

    /**
     * 创建话题.
     */
    public function createTopic(TopicEntity $topicEntity): TopicEntity;

    /**
     * 更新话题.
     */
    public function updateTopic(TopicEntity $topicEntity): bool;

    /**
     * 删除话题.
     */
    public function deleteTopic(int $id): bool;

    /**
     * 通过话题ID集合获取工作区信息.
     *
     * @param array $topicIds 话题ID集合
     * @return array 以话题ID为键，工作区信息为值的关联数组
     */
    public function getWorkspaceInfoByTopicIds(array $topicIds): array;

    /**
     * 获取话题状态统计数据.
     *
     * @param array $conditions 统计条件，如 ['user_id' => '123', 'organization_code' => 'abc']
     * @return array 包含各状态数量的数组
     */
    public function getTopicStatusMetrics(array $conditions = []): array;
}
