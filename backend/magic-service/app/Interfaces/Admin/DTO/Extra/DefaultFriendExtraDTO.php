<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Admin\DTO\Extra;

class DefaultFriendExtraDTO extends AbstractSettingExtraDTO
{
    public array $selectedAgentRootIds = [];

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
