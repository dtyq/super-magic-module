<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Exception;

use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Di\Annotation\Aspect;
use Hyperf\Di\Aop\AbstractAspect;
use Hyperf\Di\Aop\ProceedingJoinPoint;
use Hyperf\Di\Exception\Exception;
use Throwable;

#[Aspect]
/**
 * 1.为了不让用户看到一些sql/代码异常,因此会在 config/api-response.php 的 error_exception 配置中,将意外的异常转换为统一的系统内部错误异常.
 * 2.log记录异常信息,便于排查问题.
 */
class ApiResponseExceptionLogAspect extends AbstractAspect
{
    // 优先级,值越小优先级越高
    public ?int $priority = 1;

    public array $annotations = [
        ApiResponse::class,
    ];

    public function __construct(private readonly StdoutLoggerInterface $logger)
    {
    }

    /**
     * @throws Exception
     * @throws Throwable
     */
    public function process(ProceedingJoinPoint $proceedingJoinPoint)
    {
        try {
            return $proceedingJoinPoint->process();
        } catch (Throwable $exception) {
            // 一些兜底异常的log打印,可能存在重复log打印,但是为了保证异常信息不丢失,所以这里不做判断.
            $this->logger->error(
                __CLASS__ . ' 发生异常 message:{message}, code:{code}, file:{file}, line:{line}, trace:{trace}',
                [
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => $exception->getTraceAsString(),
                ]
            );
            throw $exception;
        }
    }
}
