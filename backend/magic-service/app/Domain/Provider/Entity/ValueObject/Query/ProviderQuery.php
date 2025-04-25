<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity\ValueObject\Query;

use App\Domain\Provider\Entity\ValueObject\Provider\Category;
use App\Domain\Provider\Entity\ValueObject\Provider\Status;

class ProviderQuery extends Query
{
    protected ?string $keyword = null;

    protected ?Category $category = null;

    protected ?Status $status = null;

    public function getKeyword(): ?string
    {
        return $this->keyword;
    }

    public function setKeyword(?string $keyword): self
    {
        $this->keyword = $keyword;
        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): self
    {
        $this->category = $category;
        return $this;
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
