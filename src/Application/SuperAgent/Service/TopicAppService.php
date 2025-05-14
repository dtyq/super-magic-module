<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TopicDomainService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\TopicItemDTO;

class TopicAppService
{
    public function __construct(
        protected TopicDomainService $topicDomainService,
    ) {
    }

    public function getTopic(RequestContext $requestContext, int $id): TopicItemDTO
    {
        // 获取话题内容
        $topicEntity = $this->topicDomainService->getTopicById($id);
        if (! $topicEntity) {
            ExceptionBuilder::throw(GenericErrorCode::SystemError, 'topic.not_found');
        }

        return TopicItemDTO::fromEntity($topicEntity);
    }
}
