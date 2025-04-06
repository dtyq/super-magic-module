<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\FlowExprEngine;

use Dtyq\FlowExprEngine\Structure\Structure;
use Dtyq\FlowExprEngine\Structure\StructureType;
use Throwable;

class ComponentFactory
{
    public static function fastCreate(null|array|Component $config, bool $strict = true, bool $lazy = false): ?Component
    {
        if (! $config) {
            return null;
        }
        if ($config instanceof Component) {
            return $config;
        }
        try {
            $component = self::simpleCreate($config['type'] ?? '', $config['structure'] ?? [], $config['id'] ?? null, $lazy);
        } catch (Throwable $throwable) {
            if ($strict) {
                throw $throwable;
            }
            $component = null;
        }
        return $component;
    }

    public static function fastUpdate(?Component $component, ?Component $savingComponent): ?Component
    {
        if (! $savingComponent) {
            return $component;
        }
        if ($component) {
            $component->setStructure($savingComponent->getStructure());
        } else {
            $component = $savingComponent;
        }
        return $component;
    }

    public static function generateTemplate(StructureType $type, array $structure = []): ?Component
    {
        $componentId = self::generateComponentId();
        $static = new Component();
        $static->setId($componentId);
        $static->setVersion('1');
        $static->setType($type);
        $static->createTemplate($structure);
        return $static;
    }

    private static function generateComponentId(): string
    {
        return uniqid('component-');
    }

    private static function simpleCreate(string|StructureType $type, null|array|Structure $structure, ?string $id = null, bool $lazy = false): Component
    {
        if (! $id) {
            $id = self::generateComponentId();
        }

        if (is_string($type)) {
            $type = StructureType::from($type);
        }
        $static = new Component();
        $static->setId($id);
        $static->setVersion('1');
        $static->setType($type);

        if ($lazy && is_array($structure)) {
            $static->setStructureLazy($structure);
        } else {
            $static->initStructure($structure);
        }
        return $static;
    }
}
