<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\Facade\Admin;

use App\Application\Flow\Service\MagicFlowAppService;
use App\Application\Flow\Service\MagicFlowExportImportService;
use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Interfaces\Flow\Assembler\Flow\MagicFlowAssembler;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\Di\Annotation\Inject;

#[ApiResponse(version: 'low_code')]
class MagicFlowExportImportAdminApi extends AbstractFlowAdminApi
{
    #[Inject]
    protected MagicFlowExportImportService $exportImportService;

    #[Inject]
    protected MagicFlowAppService $flowAppService;

    /**
     * 导出流程.
     */
    public function export(string $code)
    {
        $authorization = $this->getAuthorization();
        $dataIsolation = $this->createFlowDataIsolation($authorization);

        // 执行导出
        return $this->exportImportService->exportFlow($dataIsolation, $code);
    }

    /**
     * 导入流程.
     */
    public function import()
    {
        $authorization = $this->getAuthorization();
        $dataIsolation = $this->createFlowDataIsolation($authorization);

        // 获取请求参数
        $importData = $this->request->input('import_data', []);
        $agentId = $this->request->input('agent_id', ''); // 获取助理ID参数

        // 验证导入数据
        if (empty($importData)) {
            ExceptionBuilder::throw(FlowErrorCode::ValidateFailed, 'flow.import.missing_import_data');
        }

        // 执行导入
        $mainFlow = $this->exportImportService->importFlow($dataIsolation, $importData, $agentId);

        // 转换为DTO返回
        $icons = $this->flowAppService->getIcons($mainFlow->getOrganizationCode(), [$mainFlow->getIcon()]);
        return MagicFlowAssembler::createMagicFlowDTO($mainFlow, $icons);
    }

    /**
     * 创建流程数据隔离对象
     * @param mixed $authorization
     */
    protected function createFlowDataIsolation($authorization): FlowDataIsolation
    {
        return new FlowDataIsolation(
            $authorization->getOrganizationCode(),
            $authorization->getId()
        );
    }
}
