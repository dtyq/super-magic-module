<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TopicDomainService;

class TopicAppService
{
    public function __construct(
        protected TopicDomainService $topicDomainService,
    ) {
    }

    public function getTopicById(RequestContext $requestContext, $id): ?TopicEntity
    {
        return $this->topicDomainService->getTopicById($id);
    }
}
