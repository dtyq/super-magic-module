<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Contract\Flow;

interface NodeRunnerPluginInterface
{
    public function getAppendSystemPrompt(): ?string;

    /**
     * @return array<BuiltInToolInterface>
     */
    public function getTools(): array;
}
