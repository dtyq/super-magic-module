<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message\Trait;

trait Instructs
{
    // Instructs
    protected ?array $instructs = null;

    public function getInstructs(): ?array
    {
        return $this->instructs;
    }

    public function setInstructs(?array $instructs): void
    {
        $this->instructs = $instructs;
    }
}
