<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity\ValueObject\Query;

use App\Domain\Provider\Entity\ValueObject\Status;

class ProviderConfigQuery extends Query
{
    protected ?array $ids = [];

    protected ?Status $status = null;

    public function getIds(): ?array
    {
        return $this->ids;
    }

    public function setIds(?array $ids): void
    {
        $this->ids = $ids;
    }

    public function getStatus(): ?Status
    {
        return $this->status;
    }

    public function setStatus(?Status $status): self
    {
        $this->status = $status;
        return $this;
    }
}
