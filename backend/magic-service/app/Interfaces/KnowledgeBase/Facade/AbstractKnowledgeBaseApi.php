<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Facade;

use App\Application\KnowledgeBase\Service\KnowledgeBaseAppService;
use App\Application\KnowledgeBase\Service\KnowledgeBaseDocumentAppService;
use App\Application\KnowledgeBase\Service\KnowledgeBaseFragmentAppService;
use App\Infrastructure\Core\AbstractApi;
use Hyperf\HttpServer\Contract\RequestInterface;

abstract class AbstractKnowledgeBaseApi extends AbstractApi
{
    public function __construct(
        RequestInterface $request,
        protected KnowledgeBaseAppService $knowledgeBaseAppService,
        protected KnowledgeBaseDocumentAppService $knowledgeBaseDocumentAppService,
        protected KnowledgeBaseFragmentAppService $knowledgeBaseFragmentAppService,
    ) {
        parent::__construct($request);
    }
}
