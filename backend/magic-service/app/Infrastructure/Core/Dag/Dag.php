<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Dag;

use Hyperf\Context\Context;
use Hyperf\Engine\Channel;
use Hyperf\Engine\Coroutine;
use InvalidArgumentException;
use SplQueue;
use SplStack;
use Throwable;

use function Hyperf\Support\call;

class Dag implements Runner
{
    /**
     * 等待模式.（节点只允许运行一次）.
     */
    public const int WAITING_MODE = 1;

    /**
     * 非等待模式.（节点允许运行多次）.
     */
    public const int NON_WAITING_MODE = 2;

    /**
     * 并发运行.
     */
    public const int CONCURRENCY_RUNNING_MODE = 1;

    /**
     * 非并发运行.
     */
    public const int NON_CONCURRENCY_RUNNING_MODE = 2;

    /**
     * @var array<string,Vertex>
     */
    protected array $vertexes = [];

    /**
     * 节点等待模式.
     */
    protected int $nodeWaitingMode = self::WAITING_MODE;

    /**
     * 运行模式.
     */
    protected int $runningMode = self::CONCURRENCY_RUNNING_MODE;

    protected int $concurrency = 10;

    /**
     * 调度dag.
     */
    protected ?Dag $scheduleUnitDag = null;

    /**
     * 调度单元，每个单元里面是需要有序执行的节点.
     * @var array<string, Vertex>
     */
    protected array $scheduleUnits = [];

    /**
     * @var array<string, VertexResult>
     */
    protected array $vertexResults = [];

    /**
     * @var array<string, array<VertexResult>>
     */
    protected array $scheduleUnitResults = [];

    protected int $vertexNum;

    /**
     * @var array<int,array>
     */
    protected array $circularDependencies;

    protected SplStack $stack;

    /**
     * @var array<string,bool>
     */
    protected array $isInStack;

    /**
     * @var array<string,int>
     */
    protected array $dfn;

    /**
     * @var array<string,int>
     */
    protected array $low;

    protected int $time;

    public function setNodeWaitingMode(int $mode): self
    {
        $this->nodeWaitingMode = $mode;
        return $this;
    }

    public function getNodeWaitingMode(): int
    {
        return $this->nodeWaitingMode;
    }

    public function setRunningMode(int $mode): self
    {
        $this->runningMode = $mode;
        if ($mode === self::NON_CONCURRENCY_RUNNING_MODE) {
            $this->setNodeWaitingMode(self::NON_WAITING_MODE);
        }
        return $this;
    }

    public function getRunningMode(): int
    {
        return $this->runningMode;
    }

    public function addVertex(Vertex $vertex): self
    {
        $this->vertexes[$vertex->key] = $vertex;
        $this->vertexNum = count($this->vertexes);
        return $this;
    }

    public function addEdgeByKey(string $from, string $to): self
    {
        if (! isset($this->vertexes[$from]) || ! isset($this->vertexes[$to])) {
            return $this;
        }
        $this->addEdge($this->vertexes[$from], $this->vertexes[$to]);
        return $this;
    }

    public function addEdge(Vertex $from, Vertex $to): self
    {
        $from->children[] = $to;
        $to->parents[] = $from;
        return $this;
    }

    public function getVertex(string $key): ?Vertex
    {
        return $this->vertexes[$key] ?? null;
    }

    public function run(array $args = []): array
    {
        $this->scheduleUnitDag = (new Dag())
            ->setRunningMode($this->runningMode)
            ->setNodeWaitingMode($this->nodeWaitingMode);

        foreach ($this->vertexes as $vertex) {
            if (empty($vertex->parents) && $vertex->isRoot()) {
                $rootScheduleUnit = $this->parseScheduleUnit($vertex);
                $rootScheduleUnit->markAsRoot();
            }
        }

        return $this->scheduleUnitDag->runScheduleUnits($args);
    }

    public function getConcurrency(): int
    {
        return $this->concurrency;
    }

    public function setConcurrency(int $concurrency): self
    {
        $this->concurrency = $concurrency;
        return $this;
    }

    public function checkCircularDependencies(): array
    {
        $this->circularDependencies = [];
        $this->isInStack = [];
        $this->dfn = [];
        $this->low = [];
        $this->time = 1;
        $this->stack = new SplStack();

        foreach ($this->vertexes as $vertex) {
            $this->dfn[$vertex->key] = 0;
            $this->low[$vertex->key] = 0;
            $this->isInStack[$vertex->key] = false;
        }

        foreach ($this->vertexes as $vertex) {
            if ($this->dfn[$vertex->key] === 0) {
                $this->_checkCircularDependencies($vertex);
            }
        }

        return $this->circularDependencies;
    }

    /**
     * 串行运行调度单元.
     */
    protected function runScheduleUnit(Vertex $vertex): VertexResult
    {
        $vertexResult = null;

        /** @var Vertex $vertex */
        foreach ($vertex->value[0]->vertexes as $vertex) {
            /** @var VertexResult $vertexResult */
            $vertexResult = call($vertex->value, [$this->vertexResults]);
            $this->vertexResults[$vertex->key][] = $vertexResult;
            if (empty($vertexResult->getChildrenIds())) {
                break;
            }
        }

        $scheduleUnitResult = new VertexResult();
        $oldChildrenIds = $vertexResult->getChildrenIds();
        $newChildrenIds = [];
        foreach ($oldChildrenIds as $oldChildrenId) {
            $newChildrenIds[] = $this->getScheduleUnitKey($oldChildrenId);
        }
        $scheduleUnitResult->setChildrenIds($newChildrenIds);
        return $scheduleUnitResult;
    }

    /**
     * 解析为入度和出度最大为1的调度单元.
     */
    protected function parseScheduleUnit(Vertex $root, array &$parsedScheduleUnits = []): Vertex
    {
        if (isset($parsedScheduleUnits[$root->key])) {
            return $parsedScheduleUnits[$root->key];
        }

        $scheduleUnitKey = $this->getScheduleUnitKey($root->key);
        $vertex = $root;

        $rootScheduleUnitDag = new Dag();
        $rootScheduleUnitVertex = Vertex::of($rootScheduleUnitDag, $scheduleUnitKey);
        $this->scheduleUnitDag->addVertex($rootScheduleUnitVertex);
        $parsedScheduleUnits[$root->key] = $rootScheduleUnitVertex;

        $rootScheduleUnitDag->addVertex($vertex);
        while (count($vertex->children) === 1) {
            $vertex = $vertex->children[0];
            if (count($vertex->parents) > 1) {
                $childScheduleUnitVertex = $this->parseScheduleUnit($vertex, $parsedScheduleUnits);
                $this->scheduleUnitDag->addEdge($rootScheduleUnitVertex, $childScheduleUnitVertex);
                break;
            }

            $rootScheduleUnitDag->addVertex($vertex);
        }

        if (count($vertex->children) > 1) {
            foreach ($vertex->children as $child) {
                $childScheduleUnitVertex = $this->parseScheduleUnit($child, $parsedScheduleUnits);
                $this->scheduleUnitDag->addEdge($rootScheduleUnitVertex, $childScheduleUnitVertex);
            }
        }

        return $rootScheduleUnitVertex;
    }

    protected function runScheduleUnits(array $args = []): array
    {
        $queue = new SplQueue();
        $this->buildInitialQueue($queue);

        /** @var array<Channel> $visited */
        $visited = [];
        $this->vertexResults = $args;

        while (! $queue->isEmpty()) {
            $element = $queue->dequeue();
            if (! isset($visited[$element->key])) {
                // channel 将在完成相应任务后关闭
                $visited[$element->key] = new Channel();
            }

            $runFunc = function () use (&$visited, $element) {
                /* @var VertexResult $scheduleUnitResult */
                try {
                    $scheduleUnitResult = $this->runScheduleUnit($element);
                } catch (Throwable $e) {
                    $scheduleUnitResult = new VertexResult();
                    $scheduleUnitResult->setChildrenIds([]);
                    $scheduleUnitResult->setErrorMessage($e->getMessage());
                }

                $this->scheduleUnitResults[$element->key][] = $scheduleUnitResult;
                $visited[$element->key]->close();
            };
            if ($this->getRunningMode() === self::CONCURRENCY_RUNNING_MODE) {
                $fromCoroutineId = Coroutine::id();
                Coroutine::create(function () use ($runFunc, $fromCoroutineId) {
                    Context::copy($fromCoroutineId, ['request-id', 'x-b3-trace-id', 'FlowEventStreamManager::EventStream']);
                    $runFunc();
                });
            } else {
                $runFunc();
            }

            $this->scheduleChildren($element, $queue, $visited);
        }
        // 等待所有挂起的任务处理完
        foreach ($visited as $element) {
            $element->pop();
        }
        return $this->vertexResults;
    }

    /**
     * @param array<Channel> $visited
     */
    private function scheduleChildren(Vertex $element, SplQueue $queue, array &$visited): void
    {
        if ($this->getNodeWaitingMode() === self::WAITING_MODE) {
            foreach ($element->children as $child) {
                /*
                 * 判断是否还有父级在queue里面等待运行，如果有，那么这个子节点就不能运行
                 */
                if ($this->hasParentInQueue($child, $queue)) {
                    continue;
                }

                // 只有在所有的父节点完成后才调度子节点
                foreach ($child->parents as $parent) {
                    /*
                     * 说明这个子节点有多个父节点，有的父节点还没开始跑，那么这个子节点也不能加入到队列中。
                     * 需要等所有的父节点运行起来，然后再去判断父节点是否运行完了。
                     */
                    if (! isset($visited[$parent->key])) {
                        continue 2;
                    }
                    $visited[$parent->key]->pop();
                }

                // 判断是否需要调度该子节点。只要有一个父节点会调度这个子节点，那么这个子节点就会被调度
                foreach ($child->parents as $parent) {
                    $parentResult = $this->scheduleUnitResults[$parent->key][0]; // TODO: 目前只需要取第一个结果即可，后续支持循环后，这里是需要改造的
                    if (! in_array($child->key, $parentResult->getChildrenIds())) {
                        continue 2;
                    }
                }
                $queue->enqueue($child);
            }
        } else {
            // 获取element的结果，用来确定要调度哪些子级节点
            $elementResult = $this->scheduleUnitResults[$element->key][0]; // TODO: 目前只需要取第一个结果即可，后续支持循环后，这里是需要改造的
            foreach ($element->children as $child) {
                if (in_array($child->key, $elementResult->getChildrenIds())) {
                    $queue->enqueue($child);
                }
            }
        }
    }

    /**
     * 判断是否还有父级在queue里面等待运行，如果有，那么这个子节点就不能运行.
     */
    private function hasParentInQueue(Vertex $child, SplQueue $queue): bool
    {
        $waitingNodes = [];
        foreach ($queue as $item) {
            $waitingNodes[$item->key] = true;
        }

        foreach ($child->parents as $parent) {
            if (isset($waitingNodes[$parent->key])) {
                return true;
            }
        }

        return false;
    }

    private function getScheduleUnitKey(string $rootKey): string
    {
        return 'schedule_unit_' . $rootKey;
    }

    private function buildInitialQueue(SplQueue $queue): void
    {
        $roots = [];
        foreach ($this->vertexes as $vertex) {
            if (empty($vertex->parents) && $vertex->isRoot()) {
                $roots[] = $vertex;
            }
        }

        if (empty($roots)) {
            throw new InvalidArgumentException('no roots can be found in dag');
        }

        foreach ($roots as $root) {
            $queue->enqueue($root);
        }
    }

    private function isConnected(Vertex $src, Vertex $dst): bool
    {
        return in_array($dst, $src->children, true);
    }

    private function _checkCircularDependencies(Vertex $vertexSrc): void
    {
        $this->dfn[$vertexSrc->key] = $this->low[$vertexSrc->key] = $this->time++;
        $this->stack->push($vertexSrc->key);
        $this->isInStack[$vertexSrc->key] = true;

        foreach ($this->vertexes as $vertexDst) {
            if ($this->isConnected($vertexSrc, $vertexDst)) {
                if ($this->dfn[$vertexDst->key] == 0) {
                    $this->_checkCircularDependencies($vertexDst);
                    $this->low[$vertexSrc->key] = min($this->low[$vertexSrc->key], $this->low[$vertexDst->key]);
                } elseif ($this->isInStack[$vertexDst->key]) {
                    $this->low[$vertexSrc->key] = min($this->low[$vertexSrc->key], $this->dfn[$vertexDst->key]);
                }
            }
        }

        if ($this->dfn[$vertexSrc->key] == $this->low[$vertexSrc->key]) {
            $scc = [];
            do {
                $vertexKey = $this->stack->top();
                $this->stack->pop();
                $this->isInStack[$vertexKey] = false;
                $scc[] = $vertexKey;
            } while ($vertexKey != $vertexSrc->key);

            if (count($scc) > 1) {
                $this->circularDependencies[] = $scc;
            }
        }
    }
}
