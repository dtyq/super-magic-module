<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\HighAvailability\Interface;

use App\Infrastructure\Core\HighAvailability\DTO\EndpointResponseDTO;
use App\Infrastructure\Core\HighAvailability\Entity\EndpointEntity;
use App\Infrastructure\Core\HighAvailability\ValueObject\LoadBalancingType;
use App\Infrastructure\Core\HighAvailability\ValueObject\StatisticsLevel;

interface HighAvailabilityInterface
{
    /**
     * 获取可用的接入点.
     *
     * 根据随机或者加权轮询算法，通过查询统计表获取性能最好的接入点
     * 选择标准：
     * 1. 成功率最高
     * 2. 响应时间最短
     *
     * @param string $endpointType 接入点类型,比如类型：deepseek
     * @param null|string $provider 服务提供商,服务提供商：微软 | 火山 | 阿里云,可不传
     * @param null|string $endpointName 接入点名称（可选） （微软提供商时）接入点名称：美东，日本
     * @param LoadBalancingType $balancingType 负载均衡类型 随机/轮询/加权轮询
     * @param StatisticsLevel $statisticsLevel 统计级别
     * @param int $timeRange 统计时间范围（分钟），默认30分钟
     * @note 注意同类型同提供商的接入点允许有多个。
     * @return null|EndpointEntity 可用的接入点，如果没有可用接入点则返回null
     */
    public function getAvailableEndpoint(
        string $endpointType,
        ?string $provider = null,
        ?string $endpointName = null,
        LoadBalancingType $balancingType = LoadBalancingType::RANDOM,
        StatisticsLevel $statisticsLevel = StatisticsLevel::LEVEL_MINUTE,
        int $timeRange = 30
    ): ?EndpointEntity;

    /**
     * 记录接入点的响应并自动处理成功/失败状态，以及用于后续的数据分析。
     *
     * 该方法将:
     * 1. 记录请求统计数据
     * 2. 根据请求成功或失败状态自动触发熔断器反馈
     *
     * @param EndpointResponseDTO $response 接入点响应实体
     */
    public function recordResponse(EndpointResponseDTO $response): bool;

    /**
     * 批量保存接入点实体.
     *
     * 该方法将同时保存多个接入点实体，适用于批量导入或更新场景
     *
     * @param EndpointEntity[] $endpointEntities 接入点实体数组
     * @return bool 保存是否成功
     */
    public function batchSaveEndpointEntities(array $endpointEntities): bool;

    /**
     * 批量删除接入点实体（硬删除）.
     *
     * 该方法将根据提供的接入点实体数组，从数据库中永久删除这些实体
     * 硬删除不同于软删除，被删除的数据将无法恢复
     *
     * @param EndpointEntity[] $endpointEntities 要删除的接入点实体数组
     * @return bool 删除操作是否成功
     */
    public function deleteEndpointEntities(array $endpointEntities): bool;
}
