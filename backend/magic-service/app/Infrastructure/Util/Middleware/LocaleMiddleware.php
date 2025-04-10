<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Middleware;

use Hyperf\Contract\TranslatorInterface;
use Hyperf\Di\Annotation\Inject;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class LocaleMiddleware implements MiddlewareInterface
{
    #[Inject]
    protected TranslatorInterface $translator;

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $language = $request->getHeader('language')[0] ?? null;
        if (! empty($language)) {
            $this->translator->setLocale(str_replace('-', '_', $language));
        }

        return $handler->handle($request);
    }
}
