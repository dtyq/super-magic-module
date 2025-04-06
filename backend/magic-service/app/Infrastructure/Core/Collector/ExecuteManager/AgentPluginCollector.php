<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Collector\ExecuteManager;

use App\Infrastructure\Core\Collector\ExecuteManager\Annotation\AgentPluginDefine;
use App\Infrastructure\Core\Contract\Flow\AgentPluginInterface;
use Hyperf\Di\Annotation\AnnotationCollector;
use RuntimeException;

class AgentPluginCollector
{
    /**
     * @var null|array<AgentPluginInterface>
     */
    private static ?array $agentPlugins = null;

    public static function list(): array
    {
        if (! is_null(self::$agentPlugins)) {
            return self::$agentPlugins;
        }
        $agentPluginDefines = AnnotationCollector::getClassesByAnnotation(AgentPluginDefine::class);
        $agentPlugins = [];
        /**
         * @var AgentPluginDefine $agentPluginDefine
         */
        foreach ($agentPluginDefines as $class => $agentPluginDefine) {
            if (! $agentPluginDefine->isEnabled()) {
                continue;
            }
            $agentPlugin = di($class);
            if (! $agentPlugin instanceof AgentPluginInterface) {
                throw new RuntimeException(sprintf('AgentPlugin %s must implement %s', $class, AgentPluginInterface::class));
            }

            $agentPlugins[$agentPluginDefine->getCode()][$agentPluginDefine->getPriority()] = $agentPlugin;
        }
        // 获取最大的
        foreach ($agentPlugins as $code => $plugins) {
            krsort($plugins);
            $agentPlugins[$code] = array_shift($plugins);
        }

        self::$agentPlugins = $agentPlugins;
        return $agentPlugins;
    }
}
