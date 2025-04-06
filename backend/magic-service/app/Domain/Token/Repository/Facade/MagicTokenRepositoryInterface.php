<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Token\Repository\Facade;

use App\Domain\Token\Entity\MagicTokenEntity;
use App\Domain\Token\Entity\ValueObject\MagicTokenType;

interface MagicTokenRepositoryInterface
{
    /**
     * 获取 token 关联值.比如 token对应的 magic_id是多少.
     */
    public function getTokenEntity(MagicTokenEntity $tokenDTO): ?MagicTokenEntity;

    public function createToken(MagicTokenEntity $tokenDTO): void;

    public function getTokenByTypeAndRelationValue(MagicTokenType $type, string $relationValue): ?MagicTokenEntity;

    public function deleteToken(MagicTokenEntity $tokenDTO): void;
}
