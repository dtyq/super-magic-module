# Asr 工具
ASR 自动语音识别 ，利用第三方API实现语音转文字能力

目前已接入火山引擎

工具类已做好抽象，后续开发应参考火山引擎的接入方式，实现对应的接口。以下是工具类的目录结构以及注释。

# 结构以及注释

```PHP
├── AsrFacade.php                  // ASR 服务的外观类,提供简单的接口供外部调用
├── Asr.php                        // ASR 服务的主要实现类
├── Config
│   ├── ConfigInterface.php        // ASR 配置接口
│   └── VolcengineConfig.php       // 火山引擎 ASR 的具体配置实现
├── Driver
│   ├── AbstractDriver.php         // ASR 驱动的抽象基类
│   ├── DriverInterface.php        // ASR 驱动接口
│   └── Volcengine.php             // 火山引擎 ASR 驱动的实现
├── readme.md                      // 项目说明文档
├── Util
│   ├── AudioFileAnalyzer.php      // 音频文件分析工具
│   └── TextReplacer.php           // 文本替换工具
└── ValueObject
    ├── AsrPlatform.php            // ASR 平台枚举类
    ├── AsrResult.php              // ASR 识别结果值对象
    ├── AudioProperties.php        // 音频属性值对象
    ├── Language.php               // 语言枚举
    └── Volcengine      
        └── VolcengineHeader.php   // 火山引擎 ASR 协议头部处理类
```


# 调用ASR服务

```PHP
// 完整方式调用，手动填写创建ConfigInterface的实现VolcengineConfig
$result = Asr::volcengine(new VolcengineConfig($this->appId, $this->token))->recognize($audioPath);

// 简易调用方法，使用配置文件定义的默认配置
$result = AsrFacade::recognize($audioPath);

```

输入格式：音频文件的绝对路径 例如 '/mnt/ramdisk/kk/magic-service/vendor/AAAA/Machine.wav'

输出格式 ASR识别结果对象 App\Infrastructure\Util\Asr\ValueObject::AsrResult 

通过对应的 getText() 方法获取识别到的文本，后续增加其他输出结果也应该在AsrResult类内新增


# 自学习配置
自学习配置包含 热词 以及 替换词 两部分


## 热词

ASR泛热词表是一种用于语音识别服务的数据集，用于改善特定领域识别效果不佳的情况

### 热词表
增加新的热词请在这里更新

``` 
KK
KKV
x十一
叉十一
x幺幺
叉幺幺
TC
colorist

```

手动修改ENV配置，如果不会修改可使用以下方法手动生成，自动写入.ENV文件
``` PHP
\HyperfTest\Cases\Infrastructure\Util\Asr\AsrTest::testUpdateHotWordsConfig
```



## 替换词
ASR  替换词是一种用于提高语音识别准确性的技术，主要通过替换或纠正识别结果中的特定词语来实现。它解决了专有名词、同音字、缩写和方言等导致的识别错误问题，从而提高ASR系统在特定领域或场景下的识别准确率。

### 替换词表

``` 
开开集团|KK集团
x十一|X十一
叉十一|X十一
差十一|X十一
x幺幺|X十一
差幺幺|X十一
叉幺幺|X十一
则car瑞斯|THECOLORIST
TC|THECOLORIST
colorist|THECOLORIST

```

手动修改ENV配置，如果不会修改可使用以下方法手动生成，自动写入.ENV文件
``` PHP
\HyperfTest\Cases\Infrastructure\Util\Asr\AsrTest::testReplacementWordsConfig
```

本地已经通过混合算法实现了简易的替换词工具，位于
/mnt/ramdisk/kk/magic-service/app/Infrastructure/Util/Asr/Util/TextReplacer.php
仅用于极端情况下，云服务无法实现替换词作补充使用

```PHP
// 执行本地文本替换
$finalText = $this->textReplacer->replaceWordsByFuzz($finalText)
```

# 音频分析器

此工具类基于getID3库 https://www.getid3.org/ ，实现音频属性分析

ASR服务请求必须提供音频属性，以便服务端识别解析音频文件

此方法也用于校验音频分件，识别到非音频文件直接抛出异常
``` PHP
\App\Infrastructure\Util\Asr\Util\AudioFileAnalyzer::analyzeAudioFile
```

# 错误处理

```PHP
app/ErrorCode/AsrErrorCode.php // 错误码

storage/languages/zh_CN/asr.php // 中文报错信息

storage/languages/en/asr.php  // 英文报错信息
```

# Driver开发注意事项

websocket连接方式请参考此方法，是基于swow的

```PHP
\App\Infrastructure\Util\Asr\Driver\Volcengine::connect //websocket连接方法
```

