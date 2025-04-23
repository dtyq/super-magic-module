<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\ModelGateway\Service;

use App\ErrorCode\MagicApiErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use Carbon\Carbon;
use Hyperf\DbConnection\Db;

class StatisticsAppService extends AbstractLLMAppService
{
    /**
     * 来源映射表.
     */
    private const array SOURCE_MAPS = [
        'im_chat' => '麦吉 Chat',
        'api_flow' => '应用 api-key',
        'sk_flow' => '个人 api-key',
        'routine' => '定时任务',
        'test_run' => '试运行',
        'ding_robot' => '钉钉',
        'wechat_robot' => '企业微信',
        'fei_shu_robot' => '飞书',
        'rename_topic' => '重命名话题',
        'chat_completions' => '对话补全',
        'ai_search' => '深度搜索',
        'recording_summary' => '录音纪要',
        'image_generate' => '文生图',
    ];

    /**
     * 查询使用情况统计
     */
    public function queryUsage(string $start, string $end): array
    {
        [$startDate, $endDate] = $this->validateAndParseDate($start, $end);

        $modelConfigs = $this->getModelConfigs();
        $logData = $this->fetchLogData($startDate, $endDate);
        $userInfo = $this->fetchUserInfo($logData);
        $organizationInfo = $this->fetchOrganizationInfo($logData);

        $callNumber = $this->processLogData($logData, $modelConfigs, $userInfo, $organizationInfo);
        $callNumber = $this->formatUserRankings($callNumber);

        return [
            'time_range' => [
                'start' => $startDate->toDateTimeString(),
                'end' => $endDate->toDateTimeString(),
            ],
            'call_number' => array_values($callNumber),
        ];
    }

    /**
     * 验证并解析日期
     */
    private function validateAndParseDate(string $start, string $end): array
    {
        $startDate = Carbon::make($start);
        $endDate = Carbon::make($end);

        if (! $startDate || ! $endDate) {
            ExceptionBuilder::throw(MagicApiErrorCode::ValidateFailed, '时间范围不合法');
        }

        if ($startDate->diffInDays($endDate) > 7) {
            ExceptionBuilder::throw(MagicApiErrorCode::ValidateFailed, '时间范围最长为 7 天');
        }

        return [$startDate, $endDate];
    }

    /**
     * 获取模型配置.
     */
    private function getModelConfigs(): array
    {
        return Db::table('magic_api_model_configs')
            ->get()
            ->keyBy('model')
            ->toArray();
    }

    /**
     * 获取日志数据.
     */
    private function fetchLogData(Carbon $start, Carbon $end): array
    {
        return Db::table('magic_api_msg_logs')
            ->select([
                'organization_code',
                'user_id',
                'model',
                'source_id',
                'user_name',
                Db::raw('COUNT(*) AS use_count'),
            ])
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('organization_code', 'user_id', 'model', 'source_id', 'user_name')
            ->orderBy('use_count', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * 获取用户信息.
     */
    private function fetchUserInfo(array $logData): array
    {
        $userIds = array_unique(array_column($logData, 'user_id'));

        return Db::table('magic_contact_users')
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id')
            ->toArray();
    }

    /**
     * 获取组织信息.
     */
    private function fetchOrganizationInfo(array $logData): array
    {
        $organizationCodes = array_unique(array_column($logData, 'organization_code'));

        return Db::table('magic_organizations_environment')
            ->whereIn('magic_organization_code', $organizationCodes)
            ->get()
            ->keyBy('magic_organization_code')
            ->toArray();
    }

    /**
     * 处理日志数据.
     */
    private function processLogData(
        array $logData,
        array $modelConfigs,
        array $userInfo,
        array $organizationInfo
    ): array {
        $callNumber = [];

        foreach ($logData as $logDatum) {
            $modelName = $this->getModelName($logDatum, $modelConfigs);
            $userId = $logDatum['user_id'];
            $count = $logDatum['use_count'];
            $source = $this->getSourceName($logDatum['source_id'] ?? '');
            $userName = $this->getUserName($logDatum, $userInfo, $userId);
            $organizationCode = $this->getOrganizationCode($logDatum, $organizationInfo);

            // 初始化模型统计数据
            if (! isset($callNumber[$modelName])) {
                $callNumber[$modelName] = [
                    'model_name' => $modelName,
                    'total' => 0,
                    'user_rank' => [],
                ];
            }

            // 初始化用户统计数据
            if (! isset($callNumber[$modelName]['user_rank'][$userId])) {
                $callNumber[$modelName]['user_rank'][$userId] = [
                    'count' => 0,
                    'organization_code' => $organizationCode,
                    'user_name' => $userName,
                    'user_id' => $userId,
                    'source' => $source,
                ];
            }

            // 累加统计数据
            $callNumber[$modelName]['total'] += $count;
            $callNumber[$modelName]['user_rank'][$userId]['count'] += $count;
        }

        return $callNumber;
    }

    /**
     * 获取模型名称.
     */
    private function getModelName(array $logDatum, array $modelConfigs): string
    {
        $modelName = $modelConfigs[$logDatum['model']]['name'] ?? $logDatum['model'];
        return $modelName ?: $logDatum['model'];
    }

    /**
     * 获取来源名称.
     */
    private function getSourceName(string $sourceId): string
    {
        return self::SOURCE_MAPS[$sourceId] ?? $sourceId;
    }

    /**
     * 获取用户名称.
     */
    private function getUserName(array $logDatum, array $userInfo, string $userId): string
    {
        return ($userInfo[$userId]['nickname'] ?? $logDatum['user_name']) ?: $userId;
    }

    /**
     * 获取组织代码
     */
    private function getOrganizationCode(array $logDatum, array $organizationInfo): string
    {
        return $organizationInfo[$logDatum['organization_code']]['origin_organization_code']
            ?? $logDatum['organization_code'];
    }

    /**
     * 格式化用户排名.
     */
    private function formatUserRankings(array $callNumber): array
    {
        foreach ($callNumber as &$item) {
            $item['user_rank'] = array_values($item['user_rank']);
            usort($item['user_rank'], static function ($a, $b) {
                return $b['count'] <=> $a['count'];
            });
            $item['user_rank'] = array_slice($item['user_rank'], 0, 10);
        }

        return $callNumber;
    }
}
