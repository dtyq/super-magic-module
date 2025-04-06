<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model;

use App\Infrastructure\Util\Context\CoContext;
use Exception;
use GuzzleHttp\Client;
use Hyperf\Coroutine\Parallel;
use Hyperf\Di\Annotation\Inject;
use Hyperf\Engine\Coroutine;
use Hyperf\Redis\Redis;
use Psr\Log\LoggerInterface;

/**
 * 钉钉余额告警抽象类.
 */
abstract class AbstractDingTalkAlert
{
    /**
     * 钉钉机器人API地址
     */
    protected const DINGTALK_API_URL = 'https://oapi.dingtalk.com/robot/send';

    /**
     * 普通告警冷却时间（秒）.
     */
    protected const NORMAL_ALERT_COOLDOWN = 600; // 10分钟

    /**
     * 紧急告警冷却时间（秒）.
     */
    protected const URGENT_ALERT_COOLDOWN = 300; // 5分钟

    /**
     * 紧急告警阈值倍数（当余额小于阈值的多少倍时触发紧急告警）.
     */
    protected const URGENT_ALERT_MULTIPLIER = 0.5; // 余额小于阈值的50%时触发紧急告警

    protected string $accessToken = '';

    protected Client $httpClient;

    #[Inject]
    protected Redis $redis;

    #[Inject]
    protected LoggerInterface $logger;

    protected int $balanceThreshold = 100;

    /**
     * 构造函数.
     */
    public function __construct()
    {
        $this->httpClient = new Client();
        $this->accessToken = \Hyperf\Config\config('image_generate.alert.access_token');
    }

    /**
     * 获取钉钉机器人Webhook地址
     */
    protected function getDingTalkWebhook(): string
    {
        return self::DINGTALK_API_URL;
    }

    /**
     * 获取 accessToken.
     */
    protected function getAccessToken(): string
    {
        return $this->accessToken;
    }

    /**
     * 获取余额告警阈值
     */
    protected function getBalanceThreshold(): float
    {
        return $this->balanceThreshold;
    }

    /**
     * 获取告警消息前缀
     */
    abstract protected function getAlertPrefix(): string;

    /**
     * 检查账户余额.
     * @return float 当前余额
     * @throws Exception
     */
    abstract protected function checkBalance(): float;

    /**
     * 获取告警缓存键.
     * @param bool $isUrgent 是否是紧急告警
     */
    protected function getAlertCacheKey(bool $isUrgent = false): string
    {
        $suffix = $isUrgent ? ':urgent' : ':normal';
        return sprintf('balance_alert:%s:%s%s', get_class($this), md5($this->getDingTalkWebhook()), $suffix);
    }

    /**
     * 检查是否可以发送告警.
     * @param bool $isUrgent 是否是紧急告警
     */
    protected function canSendAlert(bool $isUrgent = false): bool
    {
        $cacheKey = $this->getAlertCacheKey($isUrgent);
        return ! $this->redis->exists($cacheKey);
    }

    /**
     * 记录告警发送时间.
     * @param bool $isUrgent 是否是紧急告警
     */
    protected function recordAlertSent(bool $isUrgent = false): void
    {
        $cacheKey = $this->getAlertCacheKey($isUrgent);
        $cooldown = $isUrgent ? self::URGENT_ALERT_COOLDOWN : self::NORMAL_ALERT_COOLDOWN;
        $this->redis->setex($cacheKey, $cooldown, time());
    }

    /**
     * 判断是否需要发送紧急告警.
     * @param float $balance 当前余额
     */
    protected function needUrgentAlert(float $balance): bool
    {
        return $balance <= ($this->getBalanceThreshold() * self::URGENT_ALERT_MULTIPLIER);
    }

    /**
     * 获取告警消息内容.
     * @param float $balance 当前余额
     * @param bool $isUrgent 是否是紧急告警
     */
    protected function getAlertMessage(float $balance, bool $isUrgent): string
    {
        $prefix = $this->getAlertPrefix();
        $urgentPrefix = $isUrgent ? '🆘 紧急！！！' : '⚠️';
        $urgentSuffix = $isUrgent ? "\n请务必尽快处理，余额已严重不足！！！" : '';

        return sprintf(
            '%s %s余额告警：当前余额为 %.2f，请及时充值！%s',
            $urgentPrefix,
            $prefix,
            $balance,
            $urgentSuffix
        );
    }

    /**
     * 发送余额告警到钉钉.
     * @param float $balance 当前余额
     * @throws Exception
     */
    protected function sendBalanceAlert(float $balance): bool
    {
        $isUrgent = $this->needUrgentAlert($balance);

        if (! $this->canSendAlert($isUrgent)) {
            $this->logger->info('余额告警：冷却中，跳过本次告警', [
                'class' => get_class($this),
                'balance' => $balance,
                'threshold' => $this->getBalanceThreshold(),
                'isUrgent' => $isUrgent,
            ]);
            return true;
        }

        try {
            $response = $this->httpClient->post($this->getDingTalkWebhook() . '?access_token=' . $this->getAccessToken(), [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => '*/*',
                    'User-Agent' => 'Magic-Service/1.0',
                ],
                'json' => [
                    'msgtype' => 'text',
                    'text' => [
                        'content' => $this->getAlertMessage($balance, $isUrgent),
                    ],
                ],
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if ($result['errcode'] === 0) {
                $this->recordAlertSent($isUrgent);
                $this->logger->info('余额告警：发送成功', [
                    'class' => get_class($this),
                    'balance' => $balance,
                    'isUrgent' => $isUrgent,
                ]);
                return true;
            }

            throw new Exception('钉钉接口返回错误：' . ($result['errmsg'] ?? '未知错误'));
        } catch (Exception $e) {
            $this->logger->error('余额告警：发送失败', [
                'class' => get_class($this),
                'error' => $e->getMessage(),
                'isUrgent' => $isUrgent,
            ]);
            throw new Exception('发送余额告警失败: ' . $e->getMessage());
        }
    }

    /**
     * 异步监控余额并在低于阈值时发送告警.
     */
    protected function monitorBalance(): void
    {
        $fromCoroutineId = Coroutine::id();

        $parallel = new Parallel();
        $parallel->add(function () use ($fromCoroutineId) {
            try {
                CoContext::copy($fromCoroutineId);

                $currentBalance = $this->checkBalance();
                if ($currentBalance <= $this->getBalanceThreshold()) {
                    $this->sendBalanceAlert($currentBalance);
                }
            } catch (Exception $e) {
                $this->logger->error('余额监控异常', [
                    'class' => get_class($this),
                    'error' => $e->getMessage(),
                ]);
            }
        });
    }
}
