<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Exception\Handler;

use App\ErrorCode\MagicApiErrorCode;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Util\Context\CoContext;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\Odin\Exception\LLMException;
use Hyperf\Odin\Exception\OdinException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class OpenAIProxyExceptionHandler extends AbstractExceptionHandler
{
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        $this->stopPropagation();

        $statusCode = 400;
        $errorCode = $throwable->getCode();

        $previousException = $throwable->getPrevious();
        if ($previousException instanceof LLMException) {
            $errorMessage = $previousException->getPrevious()?->getMessage() ?? $previousException->getMessage();
        } elseif ($previousException instanceof OdinException) {
            $errorMessage = $previousException->getMessage();
        } elseif ($previousException instanceof BusinessException) {
            $errorMessage = $previousException->getMessage();
            $errorCode = $previousException->getCode();
        } else {
            if ($throwable instanceof BusinessException) {
                $errorMessage = $throwable->getMessage();
                $errorCode = $throwable->getCode();
            } else {
                $errorMessage = 'system error';
                $statusCode = 500;
            }
        }

        $errorMessage = preg_replace('/https?:\/\/[^\s]+/', '', $errorMessage);

        $errorResponse = [
            'error' => [
                'message' => $errorMessage,
                'code' => $errorCode,
                'request_id' => CoContext::getRequestId(),
            ],
        ];

        return $response->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json')
            ->withBody(new SwooleStream(json_encode($errorResponse)));
    }

    public function isValid(Throwable $throwable): bool
    {
        if (! $throwable instanceof BusinessException) {
            return false;
        }

        $magicApiErrorCode = MagicApiErrorCode::tryFrom($throwable->getCode());
        if (! $magicApiErrorCode) {
            return false;
        }

        return true;
    }
}
