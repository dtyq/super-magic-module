<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelGateway\Entity\Dto;

use App\Domain\Chat\Entity\AbstractEntity;
use App\ErrorCode\MagicApiErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;

abstract class AbstractRequestDTO extends AbstractEntity implements ProxyModelRequestInterface
{
    public const string METHOD_CHAT_COMPLETIONS = 'chat_completions';

    public const string METHOD_COMPLETIONS = 'completions';

    public const string METHOD_EMBEDDINGS = 'embeddings';

    /**
     * 业务参数，比如应用版就需要额外的参数.
     */
    protected array $businessParams = [];

    protected string $callMethod = self::METHOD_CHAT_COMPLETIONS;

    protected string $accessToken = '';

    protected string $model = '';

    protected array $ips = [];

    protected array $headerConfigs = [];

    public function getBusinessParam(string $key, bool $checkExists = false): mixed
    {
        $value = $this->businessParams[$key] ?? null;
        if ($checkExists && is_null($value)) {
            ExceptionBuilder::throw(MagicApiErrorCode::ValidateFailed, 'common.empty', ['label' => $key]);
        }
        return $value;
    }

    public function setBusinessParams(array $businessParams): void
    {
        $this->businessParams = $businessParams;
    }

    public function getBusinessParams(): array
    {
        return $this->businessParams;
    }

    public function getCallMethod(): string
    {
        return $this->callMethod;
    }

    public function setCallMethod(string $callMethod): void
    {
        $this->callMethod = $callMethod;
    }

    public function getAccessToken(): string
    {
        return $this->accessToken;
    }

    public function setAccessToken(string $accessToken): void
    {
        $this->accessToken = $accessToken;
    }

    public function getModel(): string
    {
        return $this->model;
    }

    public function setModel(int|string $model): void
    {
        $this->model = (string) $model;
    }

    public function getIps(): array
    {
        return $this->ips;
    }

    public function setIps(array $ips): void
    {
        $this->ips = $ips;
    }

    public function setHeaderConfigs(array $headerConfigs): void
    {
        $this->headerConfigs = $headerConfigs;
    }

    public function getHeaderConfig(string $key, mixed $default = null): mixed
    {
        $key = strtolower($key);
        return $this->headerConfigs[$key] ?? $default;
    }
}
