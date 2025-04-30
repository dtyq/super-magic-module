"""
火山引擎语音识别简化版示例
基于simplex_websocket_demo.py，使用.env中的ASR配置进行真实API请求
"""

import os
import json
import time
import uuid
import argparse
import requests
from dotenv import load_dotenv
from typing import Dict, Tuple, Any

def submit_task(app_id: str, token: str, audio_url: str) -> Tuple[str, str]:
    """
    提交转写任务
    
    Args:
        app_id: 应用ID
        token: 访问令牌
        audio_url: 音频URL
    
    Returns:
        Tuple[str, str]: 任务ID、日志ID
    """
    task_id = str(uuid.uuid4())
    submit_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
    
    headers = {
        "X-Api-App-Key": app_id,
        "X-Api-Access-Key": token,
        "X-Api-Resource-Id": "volc.bigasr.auc",
        "X-Api-Request-Id": task_id,
        "X-Api-Sequence": "-1"
    }
    
    request = {
        "user": {
            "uid": "fake_uid"
        },
        "audio": {
            "url": audio_url,
            "format": "mp3",
            "codec": "raw",
            "rate": 16000,
            "bits": 16,
            "channel": 1
        },
        "request": {
            "model_name": "bigmodel",
            "enable_itn": True,
            "enable_punc": True,
            "show_utterances": True,
            "corpus": {
                "correct_table_name": "",
                "context": ""
            }
        }
    }
    
    print(f"提交转写任务: {task_id}")
    response = requests.post(
        submit_url,
        data=json.dumps(request),
        headers=headers
    )
    
    if 'X-Api-Status-Code' in response.headers and response.headers["X-Api-Status-Code"] == "20000000":
        print(f"任务提交成功: {task_id}")
        x_tt_logid = response.headers.get("X-Tt-Logid", "")
        return task_id, x_tt_logid
    else:
        print(f"任务提交失败: {response.headers}")
        exit(1)

def query_task(app_id: str, token: str, task_id: str, x_tt_logid: str) -> Dict[str, Any]:
    """
    查询转写任务
    
    Args:
        app_id: 应用ID
        token: 访问令牌
        task_id: 任务ID
        x_tt_logid: 日志ID
    
    Returns:
        Dict[str, Any]: 转写结果
    """
    query_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"
    
    headers = {
        "X-Api-App-Key": app_id,
        "X-Api-Access-Key": token,
        "X-Api-Resource-Id": "volc.bigasr.auc",
        "X-Api-Request-Id": task_id,
        "X-Tt-Logid": x_tt_logid
    }
    
    # 轮询查询结果
    max_retries = 60
    retry_interval = 1
    
    for attempt in range(max_retries):
        print(f"查询任务状态 (第{attempt+1}次): {task_id}")
        
        response = requests.post(
            query_url,
            data=json.dumps({}),
            headers=headers
        )
        
        code = response.headers.get('X-Api-Status-Code', "")
        
        if code == '20000000':  # 任务完成
            print("任务已完成!")
            try:
                result = response.json().get("result", {})
                return {
                    "status": "success",
                    "message": "转写成功",
                    "task_id": task_id,
                    "text": result.get("text", ""),
                    "utterances": result.get("utterances", [])
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"解析结果失败: {str(e)}",
                    "task_id": task_id
                }
                
        elif code != '20000001' and code != '20000002':  # 任务失败
            return {
                "status": "error",
                "message": f"任务失败，状态码: {code}",
                "task_id": task_id
            }
            
        # 继续等待
        time.sleep(retry_interval)
        print(".", end="", flush=True)
    
    return {
        "status": "error",
        "message": f"任务超时，查询{max_retries}次后仍未完成",
        "task_id": task_id
    }

def main():
    """
    主函数
    """
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="火山引擎语音识别服务")
    parser.add_argument("--url", required=True, help="音频文件URL")
    parser.add_argument("--format", default="mp3", help="音频格式，默认为mp3")
    args = parser.parse_args()
    
    # 从环境变量加载配置
    load_dotenv()
    
    print("火山引擎语音识别服务")
    print("=" * 50)
    
    # 获取配置
    app_id = os.environ.get("ASR_VKE_APP_ID")
    token = os.environ.get("ASR_VKE_TOKEN")
    audio_url = args.url
    
    # 检查配置
    if not app_id:
        print("错误: 请在.env中设置ASR_VKE_APP_ID")
        exit(1)
    if not token:
        print("错误: 请在.env中设置ASR_VKE_TOKEN")
        exit(1)
    if not audio_url:
        print("错误: 请提供--url参数指定音频文件地址")
        exit(1)
        
    print("\n使用以下配置:")
    print(f"    应用ID: {app_id}")
    print(f"    音频URL: {audio_url}")
    print(f"    音频格式: {args.format}")
    print("\n开始转写...\n")
    
    # 提交转写任务
    task_id, x_tt_logid = submit_task(app_id, token, audio_url)
    
    # 查询转写结果
    result = query_task(app_id, token, task_id, x_tt_logid)
    
    # 打印结果
    print("\n转写结果:")
    print("=" * 50)
    print(f"状态: {result['status']}")
    print(f"消息: {result['message']}")
    print(f"任务ID: {result['task_id']}")
    
    if result['status'] == 'success':
        print("\n文本内容:")
        print("-" * 50)
        print(result['text'])
        
        utterances = result.get('utterances', [])
        if utterances:
            print("\n分段内容:")
            print("-" * 50)
            for utterance in utterances:
                start_time = utterance['start_time'] / 1000  # 毫秒转秒
                end_time = utterance['end_time'] / 1000      # 毫秒转秒
                print(f"[{start_time:.2f}s - {end_time:.2f}s] {utterance['text']}")
    
    print("\n转写完成!")

if __name__ == '__main__':
    main() 