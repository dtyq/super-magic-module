<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Admin\Entity\ValueObject\Extra;

class DefaultFriendExtra extends AbstractSettingExtra
{
    protected array $selectedAgentRootIds = [];

    public function getSelectedAgentRootIds(): array
    {
        return $this->selectedAgentRootIds;
    }

    public function setSelectedAgentRootIds(array $selectedAgentRootIds): self
    {
        $this->selectedAgentRootIds = $selectedAgentRootIds;
        return $this;
    }
}
