<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use Hyperf\HttpServer\Contract\RequestInterface;

class GetFileUrlsRequestDTO
{
    /**
     * List of file IDs.
     */
    private array $fileIds;

    private string $token;

    private string $downloadMode;

    private string $topicId;

    /**
     * Cache setting, default is true.
     */
    private bool $cache;

    /**
     * Constructor.
     */
    public function __construct(array $params)
    {
        $this->fileIds = $params['file_ids'] ?? [];
        $this->token = $params['token'] ?? '';
        $this->downloadMode = $params['download_mode'] ?? 'download';
        $this->topicId = $params['topic_id'] ?? '';
        $this->cache = $params['cache'] ?? true;

        $this->validate();
    }

    /**
     * 从HTTP请求创建DTO.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        return new self($request->all());
    }

    /**
     * 获取文件ID列表.
     */
    public function getFileIds(): array
    {
        return $this->fileIds;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getDownloadMode(): string
    {
        return $this->downloadMode;
    }

    public function getTopicId(): string
    {
        return $this->topicId;
    }

    public function getCache(): bool
    {
        return $this->cache;
    }

    /**
     * 验证请求数据.
     *
     * @throws BusinessException 如果验证失败则抛出异常
     */
    private function validate(): void
    {
        if (empty($this->fileIds)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'file_ids.required');
        }
    }
}
