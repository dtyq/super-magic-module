<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Contract\Flow;

interface NodeParamsConfigInterface
{
    /**
     * 参数校验.
     */
    public function validate(): array;

    /**
     * 获取节点配置模板.
     */
    public function generateTemplate(): void;

    public function isSkipExecute(): bool;

    public function setSkipExecute(bool $skipExecute): void;
}
