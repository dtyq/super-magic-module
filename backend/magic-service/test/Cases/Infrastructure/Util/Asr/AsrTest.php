<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Asr;

use App\Infrastructure\Util\Asr\AsrFacade;
use App\Infrastructure\Util\Asr\Util\TextReplacer;
use Exception;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class AsrTest extends TestCase
{
    protected bool $isConsume = true;

    public function setUp(): void
    {
        parent::setUp();
    }

    /**
     * 测试语音识别功能.
     * @throws Exception
     */
    public function testAsr()
    {
        if (! $this->isConsume) {
            $this->assertTrue(true);
            return;
        }

        $audioPath = $this->getENAudioPath();
        $result = AsrFacade::recognize($audioPath);
        var_dump($result);
        $this->assertNotEmpty($result['text'], '识别结果不应为空');
    }

    /**
     * 批量测试语音识别功能.
     * @throws Exception
     */
    public function testAsrMix()
    {
        if (! $this->isConsume) {
            $this->assertTrue(true);
            return;
        }

        // 定义要处理的音频文件路径数组
        $audioPaths = [
            $this->getCNAudioPath(),
            $this->getENAudioPath(),
        ];
        foreach ($audioPaths as $audioPath) {
            $result = AsrFacade::recognize($audioPath);
            $this->assertNotEmpty($result->getText(), '识别结果不应为空');
        }
    }

    public function testReplaceWords()
    {
        $text = '开开集团创立于2015年，是国内领先的潮流零售企业。集团进行多品牌战略，旗下精致生活方式集合品牌 KKV、美妆即可品牌 TC。全球超玩文化集合品牌 X11。差十一等多个优质品牌';
        $textReplacer = di(TextReplacer::class);
        $result = $textReplacer->replaceWordsByFuzz($text);
        $this->assertNotEmpty($result);
    }

    /**
     * 生成并修改ENV中热词的配置. 配置格式：.
     * @throws Exception
     */
    public function testUpdateHotWordsConfig(): void
    {
        $this->assertTrue(true);

        $isConsume = false; // 是否启用此方法
        if (! $isConsume) {
            return;
        }

        // 使用您提供的 ASR_VKE_HOTWORDS_CONFIG 值
        $id = '';
        $name = '';
        $newValue = '[{"ID": "' . $id . '","NAME": "' . $name . '"}]';

        $envFile = '/mnt/ramdisk/kk/magic-service/.env';

        $envContent = file_get_contents($envFile);

        // 删除旧的配置
        $envContent = preg_replace('/^ASR_VKE_HOTWORDS_CONFIG\s*=.*$/m', '', $envContent);

        // 去除多余的空行
        $envContent = preg_replace("/[\r\n]+/", "\n", $envContent);

        // 添加新的配置，确保每个配置单独占一行
        $envContent .= "\nASR_VKE_HOTWORDS_CONFIG='{$newValue}'\n";

        // 写入更新后的内容
        file_put_contents($envFile, $envContent);
    }

    /**
     * 生成并修改ENV中替换词的配置.
     * @throws Exception
     */
    public function testReplacementWordsConfig()
    {
        $this->assertTrue(true);

        $isConsume = false; // 是否启用此方法
        if (! $isConsume) {
            return;
        }

        // 使用您提供的 ASR_VKE_REPLACEMENT_WORDS_CONFIG 值
        $id = '';
        $name = '';
        $newValue = '[{"ID": "' . $id . '","NAME": "' . $name . '"}]';

        $envFile = '/mnt/ramdisk/kk/magic-service/.env';

        $envContent = file_get_contents($envFile);

        // 删除旧的配置
        $envContent = preg_replace('/^ASR_VKE_REPLACEMENT_WORDS_CONFIG\s*=.*$/m', '', $envContent);

        // 去除多余的空行
        $envContent = preg_replace("/[\r\n]+/", "\n", $envContent);

        // 添加新的配置，确保每个配置单独占一行
        $envContent .= "\nASR_VKE_REPLACEMENT_WORDS_CONFIG='{$newValue}'\n";

        // 写入更新后的内容
        file_put_contents($envFile, $envContent);
    }

    /**
     * 识别录音文件.
     */
    public function testRecognizeVoice()
    {
        $audioPath = $this->getENAudioPath();
        $audioUrl = $this->getENAudioUrl();
        //        $audioPath = 'test11.wav';
        //        $audioUrl = 'https://saas-teamshare-test.oss-cn-shenzhen.aliyuncs.com/DT001/588417216353927169/Fmn3EfCdTSMw2dLXLCxxYStawi-I.wav?OSSAccessKeyId=LTAI5t9yNm8nnmx5KAJsQ5vT&Expires=1734424495&Signature=3fnW%2BPQ4BQXUwBpu7sItuEllODI%3D';
        $result = AsrFacade::recognizeVoice($audioUrl);
        $this->assertNotEmpty($result);
    }

    protected function getCNAudioPath()
    {
        // 纯中文
        $audioUrl = 'https://sis-sample-audio.obs.cn-north-1.myhuaweicloud.com/16k16bit.wav';

        // 临时文件路径
        $tempDir = BASE_PATH . '/runtime';
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }
        $audioPath = $tempDir . '/temp_cn_test.wav';

        // 检查本地是否已有音频文件
        if (! file_exists($audioPath)) {
            file_put_contents($audioPath, file_get_contents($audioUrl));
        }
        return $audioPath;
    }

    protected function getENAudioPath()
    {
        // 中英混合
        $audioUrl = $this->getENAudioUrl();

        // 临时文件路径
        $tempDir = BASE_PATH . '/runtime';
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }
        $audioPath = $tempDir . '/temp_en_test.wav';

        // 检查本地是否已有音频文件
        if (! file_exists($audioPath)) {
            file_put_contents($audioPath, file_get_contents($audioUrl));
        }
        return $audioPath;
    }

    private function getENAudioUrl()
    {
        return 'https://paddlespeech.bj.bcebos.com/PaddleAudio/ch_zh_mix.wav';
    }
}
