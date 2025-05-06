<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\Share\Factory\Facade;

use Dtyq\SuperMagic\Application\Share\DTO\ShareableResourceDTO;
use RuntimeException;

/**
 * 资源工厂接口
 * 用于创建可共享资源对象的工厂接口.
 */
interface ResourceFactoryInterface
{
    /**
     * 获取该工厂支持的业务资源类型名称.
     */
    public function getResourceName(string $resourceId): string;

    /**
     * 扩展话题分享列表的数据.
     */
    public function getResourceExtendList(array $list): array;

    /**
     * 获取业务资源内容.
     */
    public function getResourceContent(string $resourceId, string $userId, string $organizationCode, int $page, int $pageSize): array;

    /**
     * 根据资源ID创建一个可共享资源对象
     *
     * @param string $resourceId 资源ID
     * @param string $userId 用户id
     * @param string $organizationCode 组织代码
     * @return ShareableResourceDTO 可共享资源对象
     * @throws RuntimeException 当资源不存在或无法创建共享资源时抛出异常
     */
    public function createResource(string $resourceId, string $userId, string $organizationCode): ShareableResourceDTO;

    /**
     * 检查资源是否存在且可以被共享.
     *
     * @param string $resourceId 资源ID
     * @param string $organizationCode 组织代码
     * @return bool 资源是否存在且可共享
     */
    public function isResourceShareable(string $resourceId, string $organizationCode): bool;

    /**
     * 检查用户是否有权限共享该资源.
     *
     * @param string $resourceId 资源ID
     * @param string $userId 用户ID
     * @param string $organizationCode 组织代码
     * @return bool 是否有共享权限
     */
    public function hasSharePermission(string $resourceId, string $userId, string $organizationCode): bool;
}
