<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Admin\DTO\Extra\Item;

use App\Infrastructure\Core\AbstractDTO;

class AgentItemDTO extends AbstractDTO
{
    public string $rootId;

    public ?string $name;

    public ?string $avatar;

    public function __construct(null|array|string $data = null)
    {
        // 兼容前端传参
        is_string($data) && $data = ['root_id' => $data];
        parent::__construct($data);
    }

    public function getRootId(): string
    {
        return $this->rootId;
    }

    public function setRootId(string $rootId): self
    {
        $this->rootId = $rootId;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): self
    {
        $this->avatar = $avatar;
        return $this;
    }
}
