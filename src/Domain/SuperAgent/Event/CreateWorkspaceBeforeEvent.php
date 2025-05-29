<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Event;

class CreateWorkspaceBeforeEvent
{
    public function __construct(
        private string $organizationCode,
        private string $userId,
        private string $workspaceName,
    ) {
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getWorkspaceName(): string
    {
        return $this->workspaceName;
    }
}
