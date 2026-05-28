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
     * Keyset cursor: last file_id of the previous page. Empty means first page.
     */
    protected string $cursor = '';

    /**
     * File type filter.
     */
    protected array $fileType = [];

    /**
     * Access token (for non-login mode).
     */
    protected ?string $token = null;

    /**
     * Updated after timestamp (for filtering files updated after this time).
     */
    protected ?string $updatedAfter = null;

    public function __construct(array $data = [], ?string $projectId = null)
    {
        $this->projectId = $projectId ?? (string) ($data['project_id'] ?? '');
        $this->pageSize = $this->clampPageSize((int) ($data['page_size'] ?? self::DEFAULT_PAGE_SIZE));
        $this->cursor = (string) ($data['cursor'] ?? '');
        $this->token = $data['token'] ?? null;
        $this->updatedAfter = $data['updated_after'] ?? null;

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

    public function getCursor(): string
    {
        return $this->cursor;
    }

    public function getFileType(): array
    {
        return $this->fileType;
    }

    public function getUpdatedAfter(): ?string
    {
        return $this->updatedAfter;
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

    public function setCursor(string $cursor): self
    {
        $this->cursor = $cursor;
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

    public function setUpdatedAfter(?string $updatedAfter): self
    {
        $this->updatedAfter = $updatedAfter;
        return $this;
    }

    private function clampPageSize(int $value): int
    {
        if ($value <= 0) {
            return self::DEFAULT_PAGE_SIZE;
        }
        return min($value, self::MAX_PAGE_SIZE);
    }
}
