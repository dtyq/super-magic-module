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
     * 文件ID列表.
     */
    private array $fileIds;

    private string $token;

    /**
     * 构造函数.
     */
    public function __construct(array $params)
    {
        $this->fileIds = $params['file_ids'] ?? [];
        $this->token = $params['token'] ?? '';

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
