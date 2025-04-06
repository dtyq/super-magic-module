<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Context;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Hyperf\HttpServer\Contract\RequestInterface;
use Psr\Http\Message\ServerRequestInterface;
use Qbhy\HyperfAuth\Authenticatable;

class RequestContext
{
    protected string $userId = '';

    protected string $organizationCode = '';

    protected string $authorization = '';

    protected Authenticatable|MagicUserAuthorization $userAuthorization;

    protected ?DataIsolation $dataIsolation = null;

    protected string $thirdPlatformAccessToken = '';

    public static function getRequestContext(RequestInterface|ServerRequestInterface $request): self
    {
        return $request->getAttribute('request_context');
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function setUserId(string $userId): void
    {
        $this->userId = $userId;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function setOrganizationCode(string $organizationCode): void
    {
        $this->organizationCode = $organizationCode;
    }

    public function getAuthorization(): string
    {
        return $this->authorization;
    }

    public function setAuthorization(string $authorization): void
    {
        $this->authorization = $authorization;
    }

    public function getUserAuthorization(): MagicUserAuthorization
    {
        /* @phpstan-ignore-next-line */
        return $this->userAuthorization;
    }

    public function setUserAuthorization(MagicUserAuthorization $userAuthorization): void
    {
        $this->userAuthorization = $userAuthorization;
    }

    public function getDataIsolation(): ?DataIsolation
    {
        return $this->dataIsolation;
    }

    public function setDataIsolation(?DataIsolation $dataIsolation): RequestContext
    {
        $this->dataIsolation = $dataIsolation;
        return $this;
    }

    public function getThirdPlatformAccessToken(): string
    {
        return $this->thirdPlatformAccessToken;
    }

    public function setThirdPlatformAccessToken(string $thirdPlatformAccessToken): RequestContext
    {
        $this->thirdPlatformAccessToken = $thirdPlatformAccessToken;
        return $this;
    }
}
