<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Flow\Entity\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;
use Dtyq\FlowExprEngine\Kernel\Utils\Functions;

class NodeDebugResult extends AbstractValueObject
{
    /**
     *  节点是否执行成功
     */
    protected bool $success = false;

    protected float $startTime = 0;

    protected float $endTime = 0;

    protected int $errorCode = 0;

    /**
     *  节点执行失败时的错误信息.
     */
    protected string $errorMessage = '';

    protected string $nodeVersion = '';

    /**
     *  节点执行参数.
     */
    protected array $params = [];

    /**
     *  节点执行输入.
     */
    protected array $input = [];

    /**
     *  节点执行输出.
     */
    protected array $output = [];

    protected array $childrenIds = [];

    protected array $debugLog = [];

    protected ?array $loopDebugResults = null;

    protected bool $throwException = true;

    public function __construct(string $nodeVersion)
    {
        $this->nodeVersion = $nodeVersion;
        parent::__construct();
    }

    public function hasExecute(): bool
    {
        return isset($this->success);
    }

    public function getElapsedTime(): string
    {
        if (isset($this->startTime, $this->endTime)) {
            return (string) Functions::calculateElapsedTime($this->startTime, $this->endTime);
        }
        return '0';
    }

    public function setSuccess(bool $success): void
    {
        $this->success = $success;
    }

    public function isSuccess(): bool
    {
        return $this->success ?? false;
    }

    public function addLoopDebugResult(NodeDebugResult $nodeDebugResult): void
    {
        $debugResult = clone $nodeDebugResult;
        $debugResult->setLoopDebugResults(null);
        $this->loopDebugResults[] = $debugResult;
    }

    public function isUnAuthorized(): bool
    {
        return $this->errorCode == 40101;
    }

    public function setThrowException(bool $throwException): void
    {
        $this->throwException = $throwException;
    }

    public function isThrowException(): bool
    {
        return $this->throwException;
    }

    public function getStartTime(): float
    {
        return $this->startTime;
    }

    public function setStartTime(float $startTime): void
    {
        $this->startTime = $startTime;
    }

    public function getEndTime(): float
    {
        return $this->endTime;
    }

    public function setEndTime(float $endTime): void
    {
        $this->endTime = $endTime;
    }

    public function getErrorCode(): int
    {
        return $this->errorCode;
    }

    public function setErrorCode(int $errorCode): void
    {
        $this->errorCode = $errorCode;
    }

    public function getErrorMessage(): string
    {
        return $this->errorMessage;
    }

    public function setErrorMessage(string $errorMessage): void
    {
        $this->errorMessage = $errorMessage;
    }

    public function getNodeVersion(): string
    {
        return $this->nodeVersion;
    }

    public function setNodeVersion(string $nodeVersion): void
    {
        $this->nodeVersion = $nodeVersion;
    }

    public function getParams(): array
    {
        return $this->params;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    public function getInput(): array
    {
        return $this->input;
    }

    public function setInput(array $input): void
    {
        $this->input = $input;
    }

    public function getOutput(): array
    {
        return $this->output;
    }

    public function setOutput(array $output): void
    {
        $this->output = $output;
    }

    public function getChildrenIds(): array
    {
        return $this->childrenIds;
    }

    public function setChildrenIds(array $childrenIds): void
    {
        $this->childrenIds = $childrenIds;
    }

    public function getDebugLog(): array
    {
        return $this->debugLog;
    }

    public function setDebugLog(array $debugLog): void
    {
        $this->debugLog = $debugLog;
    }

    public function getLoopDebugResults(): ?array
    {
        return $this->loopDebugResults;
    }

    public function setLoopDebugResults(?array $loopDebugResults): void
    {
        $this->loopDebugResults = $loopDebugResults;
    }

    public function toArray(): array
    {
        $loopDebugResults = $this->loopDebugResults ?? [];
        // 有多个结果时，才需要有 loop_debug_results
        if (count($loopDebugResults) <= 1) {
            $loopDebugResults = [];
        }

        return [
            'success' => $this->success,
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'elapsed_time' => $this->getElapsedTime(),
            'error_code' => $this->errorCode,
            'error_message' => $this->errorMessage,
            'node_version' => $this->nodeVersion,
            'params' => $this->params,
            'input' => $this->input,
            'output' => $this->output,
            'children_ids' => $this->childrenIds,
            'debug_log' => $this->debugLog,
            'loop_debug_results' => array_map(fn (NodeDebugResult $nodeDebugResult) => $nodeDebugResult->toArray(), $loopDebugResults),
        ];
    }

    public function toDesensitizationArray(): array
    {
        $loopDebugResults = $this->loopDebugResults ?? [];
        // 有多个结果时，才需要有 loop_debug_results
        if (count($loopDebugResults) <= 1) {
            $loopDebugResults = [];
        }

        return [
            'success' => $this->success,
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'elapsed_time' => $this->getElapsedTime(),
            'error_code' => $this->errorCode,
            'error_message' => $this->errorMessage,
            'node_version' => $this->nodeVersion,
            'children_ids' => $this->childrenIds,
            'loop_debug_results' => array_map(fn (NodeDebugResult $nodeDebugResult) => $nodeDebugResult->toDesensitizationArray(), $loopDebugResults),
        ];
    }
}
