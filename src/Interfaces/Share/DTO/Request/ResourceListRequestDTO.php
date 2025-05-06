<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 资源列表请求DTO.
 */
class ResourceListRequestDTO extends AbstractDTO
{
    /**
     * 当前页码.
     */
    public int $page = 1;

    /**
     * 每页条数.
     */
    public int $pageSize = 10;

    /**
     * 搜索关键词.
     */
    public string $keyword = '';

    /**
     * 资源类型.
     */
    public ?int $resourceType = null;

    /**
     * 从请求中创建DTO.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $dto = new self();
        $dto->page = (int) $request->input('page', 1);
        $dto->pageSize = (int) $request->input('page_size', 10);
        $dto->keyword = (string) $request->input('keyword', '');
        $dto->resourceType = $request->has('resource_type') ? (int) $request->input('resource_type') : null;

        return $dto;
    }

    /**
     * 设置页码.
     */
    public function setPage(int $page): self
    {
        $this->page = $page;
        return $this;
    }

    /**
     * 获取页码.
     */
    public function getPage(): int
    {
        return $this->page;
    }

    /**
     * 设置每页条数.
     */
    public function setPageSize(int $pageSize): self
    {
        $this->pageSize = $pageSize;
        return $this;
    }

    /**
     * 获取每页条数.
     */
    public function getPageSize(): int
    {
        return $this->pageSize;
    }

    /**
     * 设置搜索关键词.
     */
    public function setKeyword(string $keyword): self
    {
        $this->keyword = $keyword;
        return $this;
    }

    /**
     * 获取搜索关键词.
     */
    public function getKeyword(): string
    {
        return $this->keyword;
    }

    /**
     * 设置资源类型.
     */
    public function setResourceType(?int $resourceType): self
    {
        $this->resourceType = $resourceType;
        return $this;
    }

    /**
     * 获取资源类型.
     */
    public function getResourceType(): ?int
    {
        return $this->resourceType;
    }

    /**
     * 构建验证规则.
     */
    public function rules(): array
    {
        return [
            'page' => 'integer|min:1',
            'page_size' => 'integer|min:1|max:100',
            'keyword' => 'nullable|string|max:255',
            'resource_type' => 'nullable|integer|min:1',
        ];
    }

    /**
     * 获取验证错误消息.
     */
    public function messages(): array
    {
        return [
            'page.integer' => '页码必须是整数',
            'page.min' => '页码最小为1',
            'page_size.integer' => '每页条数必须是整数',
            'page_size.min' => '每页条数最小为1',
            'page_size.max' => '每页条数最大为100',
            'keyword.max' => '关键词最大长度为255个字符',
            'resource_type.integer' => '资源类型必须是整数',
            'resource_type.min' => '资源类型最小为1',
        ];
    }

    /**
     * 属性名称.
     */
    public function attributes(): array
    {
        return [
            'page' => '页码',
            'page_size' => '每页条数',
            'keyword' => '搜索关键词',
            'resource_type' => '资源类型',
        ];
    }
}
