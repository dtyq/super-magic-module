<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Router;

use Hyperf\Contract\ConfigInterface;
use Psr\Container\ContainerInterface;

class RouteLoader
{
    /**
     * @var ContainerInterface
     */
    protected $container;

    /**
     * @var ConfigInterface
     */
    protected $config;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->config = $container->get(ConfigInterface::class);
    }

    /**
     * 加载所有路由.
     */
    public function loadRoutes(): void
    {
        $routesConfig = $this->config->get('routes', []);
        // 加载基础路由
        $this->loadBaseRoutes($routesConfig);

        // 加载 v1 版本 API 路由
        $this->loadV1Routes($routesConfig);

        // 加载组件包路由
        $this->loadComponentRoutes($routesConfig);

        // 兼容模式：加载旧版路由文件
        $this->loadLegacyRoutes($routesConfig);
    }

    /**
     * 加载基础路由.
     */
    protected function loadBaseRoutes(array $routesConfig): void
    {
        if (isset($routesConfig['base']['path'])) {
            $basePath = $routesConfig['base']['path'];
            if (is_file($basePath)) {
                require_once $basePath;
            }
        }
    }

    /**
     * 加载 v1 版本 API 路由.
     */
    protected function loadV1Routes(array $routesConfig): void
    {
        if (isset($routesConfig['v1']['path'], $routesConfig['v1']['files'])) {
            $basePath = $routesConfig['v1']['path'];
            foreach ($routesConfig['v1']['files'] as $file) {
                $filePath = $basePath . '/' . $file;
                if (is_file($filePath)) {
                    require_once $filePath;
                }
            }
        }
    }

    /**
     * 加载组件包路由.
     */
    protected function loadComponentRoutes(array $routesConfig): void
    {
        if (isset($routesConfig['components'])) {
            foreach ($routesConfig['components'] as $component) {
                if (isset($component['path'])) {
                    $componentPath = BASE_PATH . '/' . $component['path'];
                    if (is_dir($componentPath)) {
                        // 如果是目录，加载目录下的所有 PHP 文件
                        $files = glob($componentPath . '/*.php');
                        foreach ($files as $file) {
                            if (file_exists($file)) {
                                require_once $file;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 处理组件路由.
     * @param mixed $routes
     */
    protected function processComponentRoutes($routes): void
    {
        // 根据组件路由的格式进行处理
        // 这里需要根据实际情况实现
    }

    /**
     * 加载旧版路由文件.
     */
    protected function loadLegacyRoutes(array $routesConfig): void
    {
        if (isset($routesConfig['legacy'], $routesConfig['legacy']['files'])) {
            foreach ($routesConfig['legacy']['files'] as $file) {
                $filePath = BASE_PATH . '/config/' . $file;
                if (file_exists($filePath)) {
                    require_once $filePath;
                }
            }
        }
    }
}
