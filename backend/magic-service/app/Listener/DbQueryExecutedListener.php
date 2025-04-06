<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Listener;

use Hyperf\Collection\Arr;
use Hyperf\Database\Events\QueryExecuted;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

#[Listener]
class DbQueryExecutedListener implements ListenerInterface
{
    private LoggerInterface $logger;

    // 敏感表
    private array $sensitiveTables = [
        'magic_chat_messages',
        'magic_chat_message_versions',
        'magic_flow_memory_histories',
    ];

    public function __construct(ContainerInterface $container)
    {
        $this->logger = $container->get(LoggerFactory::class)->get('sql');
    }

    public function listen(): array
    {
        return [
            QueryExecuted::class,
        ];
    }

    /**
     * @param QueryExecuted $event
     */
    public function process(object $event): void
    {
        if ($event instanceof QueryExecuted) {
            $sql = $event->sql;
            if (! Arr::isAssoc($event->bindings)) {
                $position = 0;
                foreach ($event->bindings as $value) {
                    $position = strpos($sql, '?', $position);
                    if ($position === false) {
                        break;
                    }
                    $value = "'{$value}'";
                    $sql = substr_replace($sql, $value, $position, 1);
                    $position += strlen($value);
                }
            }
            // 对敏感表的SQL进行脱敏处理
            $sql = $this->desensitizeSql($sql);
            $this->logger->info(sprintf('[%s:%s] %s', $event->connectionName, $event->time, $sql));
        }
    }

    /**
     * 对敏感表的SQL进行脱敏处理
     * 1. 对INSERT语句，保留id字段值，其他字段值替换为'***'
     * 2. 对UPDATE语句，将修改的字段值替换为'***'.
     */
    private function desensitizeSql(string $sql): string
    {
        // 检查是否操作敏感表
        $isSensitive = false;
        foreach ($this->sensitiveTables as $table) {
            if (str_contains($sql, $table)) {
                $isSensitive = true;
                break;
            }
        }

        // 如果不是敏感表，直接返回
        if (! $isSensitive) {
            return $sql;
        }

        // 处理INSERT语句
        if (str_contains($sql, 'insert into')) {
            // 提取并保留id字段，替换其他字段值为'***'
            $pattern = '/values\s*\(([^)]+)\)/i';
            if (preg_match($pattern, $sql, $matches) && ! empty($matches[1])) {
                $values = explode(',', $matches[1], 2);
                // 假设第一个字段是id
                $idValue = trim($values[0]);
                $sql = preg_replace($pattern, 'VALUES (' . $idValue . ', ***)', $sql);
            } else {
                // 如果无法解析字段，则整体替换
                $sql = preg_replace('/values\s*\([^)]+\)/i', 'VALUES (***)', $sql);
            }
        }

        // 处理UPDATE语句
        if (str_contains($sql, 'update') && str_contains($sql, 'set')) {
            // 提取SET和WHERE之间的部分
            if (preg_match('/\bset\b(.*?)(?:\bwhere\b|$)/is', $sql, $setMatches)) {
                $setClause = $setMatches[1];

                // 使用更健壮的方式分割SET子句中的赋值部分
                $pattern = '/(`?\w+`?(?:\.[`\w]+)?)\s*=\s*(?:\'(?:[^\'\\\]|\\\.)*\'|"(?:[^"\\\]|\\\.)*"|[^,]+)(?:,|$)/';

                $replacedSetClause = preg_replace_callback($pattern, function ($matches) {
                    // 保留字段名，替换值为'***'
                    return $matches[1] . " = '***'";
                }, $setClause);

                // 替换原SQL中的SET子句
                if ($replacedSetClause) {
                    $sql = str_replace($setClause, $replacedSetClause, $sql);
                }
            }
        }

        return $sql;
    }
}
