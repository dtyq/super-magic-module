<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Admin\Agent\Assembler;

use App\Application\Admin\Agent\DTO\AdminAgentDTO;
use App\Domain\Agent\Entity\MagicAgentEntity;

class AgentAssembler
{
    // entity 转 dto
    public static function entityToDTO(MagicAgentEntity $entity): AdminAgentDTO
    {
        return new AdminAgentDTO($entity->toArray());
    }
}
