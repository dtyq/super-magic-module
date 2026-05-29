<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use Hyperf\HttpServer\Contract\RequestInterface;

class GetProjectAttachmentsV2RequestDTO
{
    public const DEFAULT_PAGE_SIZE = 1000;

    public const MAX_PAGE_SIZE = 1000;

    protected string $projectId;

    /**
     * Items per page, clamped to [1, MAX_PAGE_SIZE].
     */
    protected int $pageSize;

    /**
     * Backend-managed breadth-first traversal queue.
     *
     * @var array<int, array{parent_id: string, after_sort: null|int, after_file_id: null|string}>
     */
    protected array $nextParentIds = [];

    /**
     * File type filter.
     */
    protected array $fileType = [];

    /**
     * Access token (for non-login mode).
     */
    protected ?string $token = null;

    public function __construct(array $data = [], ?string $projectId = null)
    {
        $this->projectId = $projectId ?? (string) ($data['project_id'] ?? '');
        $this->pageSize = $this->clampPageSize((int) ($data['page_size'] ?? self::DEFAULT_PAGE_SIZE));
        $this->nextParentIds = $this->normalizeNextParentIds($data['next_parent_ids'] ?? []);
        $this->token = $data['token'] ?? null;

        if (isset($data['file_type'])) {
            if (is_array($data['file_type'])) {
                $this->fileType = $data['file_type'];
            } elseif (is_string($data['file_type']) && $data['file_type'] !== '') {
                $this->fileType = [$data['file_type']];
            }
        }
    }

    public static function fromRequest(RequestInterface $request): self
    {
        return new self(
            $request->all(),
            $request->route('id')
        );
    }

    public function getProjectId(): string
    {
        return $this->projectId;
    }

    public function getPageSize(): int
    {
        return $this->pageSize;
    }

    /**
     * @return array<int, array{parent_id: string, after_sort: null|int, after_file_id: null|string}>
     */
    public function getNextParentIds(): array
    {
        return $this->nextParentIds;
    }

    public function getFileType(): array
    {
        return $this->fileType;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setProjectId(string $projectId): self
    {
        $this->projectId = $projectId;
        return $this;
    }

    public function setPageSize(int $pageSize): self
    {
        $this->pageSize = $this->clampPageSize($pageSize);
        return $this;
    }

    public function setNextParentIds(array $nextParentIds): self
    {
        $this->nextParentIds = $this->normalizeNextParentIds($nextParentIds);
        return $this;
    }

    public function setFileType(array $fileType): self
    {
        $this->fileType = $fileType;
        return $this;
    }

    public function setToken(?string $token): self
    {
        $this->token = $token;
        return $this;
    }

    private function clampPageSize(int $value): int
    {
        if ($value <= 0) {
            return self::DEFAULT_PAGE_SIZE;
        }
        return min($value, self::MAX_PAGE_SIZE);
    }

    /**
     * @return array<int, array{parent_id: string, after_sort: null|int, after_file_id: null|string}>
     */
    private function normalizeNextParentIds(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : [$value];
        }

        if (! is_array($value)) {
            return [];
        }

        $result = [];
        $seen = [];
        foreach ($value as $item) {
            $state = $this->normalizeParentState($item);
            if ($state === null) {
                continue;
            }

            $key = implode(':', [
                $state['parent_id'],
                (string) ($state['after_sort'] ?? ''),
                (string) ($state['after_file_id'] ?? ''),
            ]);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $result[] = $state;
        }

        return $result;
    }

    /**
     * @return null|array{parent_id: string, after_sort: null|int, after_file_id: null|string}
     */
    private function normalizeParentState(mixed $item): ?array
    {
        if (is_string($item) || is_int($item)) {
            $parentId = trim((string) $item);
            if ($parentId === '' || $parentId === '0') {
                return null;
            }

            return [
                'parent_id' => $parentId,
                'after_sort' => null,
                'after_file_id' => null,
            ];
        }

        if (! is_array($item)) {
            return null;
        }

        $parentId = trim((string) ($item['parent_id'] ?? ''));
        if ($parentId === '' || $parentId === '0') {
            return null;
        }

        $afterSort = isset($item['after_sort']) && is_numeric($item['after_sort'])
            ? (int) $item['after_sort']
            : null;
        $afterFileId = isset($item['after_file_id'])
            ? trim((string) $item['after_file_id'])
            : null;

        if ($afterSort === null || $afterFileId === '') {
            $afterFileId = null;
        }

        return [
            'parent_id' => $parentId,
            'after_sort' => $afterSort,
            'after_file_id' => $afterFileId,
        ];
    }
}
