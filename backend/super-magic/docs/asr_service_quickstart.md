# 语音识别服务使用说明

## 配置准备

在火山引擎控制台获取ASR服务的配置信息，并设置以下环境变量：
- ASR_VKE_APP_ID: 火山引擎应用ID
- ASR_VKE_TOKEN: 火山引擎访问令牌
- ASR_VKE_CLUSTER: 火山引擎集群名称 (可选)
- ASR_VKE_SECRET_KEY: 火山引擎密钥 (可选)

## 使用示例

### 使用示例脚本
```bash
python simplex_asr_example.py --url https://example.com/path/to/audio.mp3
```

### 代码中使用
```python
from app.infrastructure.asr.factory import ASRServiceFactory

# 获取ASR服务实例
asr_service = ASRServiceFactory.get_ve_asr_service()

# 转写音频文件
result = asr_service.transcribe(
    audio_url="https://example.com/path/to/audio.mp3",
    audio_format="mp3",
    sample_rate=16000
)

# 使用结果
print(result.text)

# 获取带时间戳的分段结果
for utterance in result.utterances:
    start_time = utterance.start_time / 1000.0  # 毫秒转秒
    end_time = utterance.end_time / 1000.0
    print(f"[{start_time:.2f}s - {end_time:.2f}s] {utterance.text}")
```

### 使用工具API
在LLM工具中使用ASR转录功能：

```json
{
  "name": "asr_transcribe",
  "parameters": {
    "audio_url": "https://example.com/path/to/audio.mp3",
    "audio_format": "mp3",
    "sample_rate": 16000
  }
}
``` 