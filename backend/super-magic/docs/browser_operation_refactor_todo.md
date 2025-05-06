# 浏览器操作（Operation）声明优化方案

## 背景与目标

当前浏览器操作工具(`UseBrowser`)中的每个操作(operation)声明方式较为冗长，主要通过装饰器定义参数结构和示例。随着操作数量增加，这种方式将导致代码重复、维护困难，并且不利于扩展。

本方案旨在：
- 减少每个operation声明的代码量
- 提高代码可维护性
- 支持更灵活的操作扩展
- 保持功能完整性和兼容性

## 当前代码结构分析

目前的实现主要问题：

1. 每个操作通过`register_operation`装饰器注册，需要手写JSONSchema
2. 参数验证逻辑分散，部分在装饰器中，部分在执行方法中
3. 公共参数(如page_id)在每个操作中重复定义
4. 操作示例需要手动维护
5. 所有操作都集中在一个文件中，不便于按功能分组管理

## 改进方案

### 1. 使用Pydantic模型替代JSONSchema

将每个操作的参数定义为Pydantic模型，利用Pydantic的类型注解自动生成JSONSchema。

### 2. 操作模块化与分组

将操作按功能分类，拆分到独立模块中，通过插件式架构动态加载。

### 3. 基类参数提取

提取常见参数(如page_id)到基础参数类中，各操作通过继承复用。

### 4. 简化装饰器设计

优化装饰器，减少重复信息，自动从方法文档提取描述。

### 5. 自动示例生成

根据参数定义和默认值自动生成合理的示例代码。

### 6. 统一参数验证

集中处理参数验证逻辑，避免在每个操作中重复实现。

## 实施步骤与TODO列表

### 阶段一：基础结构设计

- [ ] 1.1 创建基础参数模型
- [ ] 1.2 设计操作注册器
- [ ] 1.3 设计操作加载机制
- [ ] 1.4 调整工具上下文结构

### 阶段二：Pydantic模型实现

- [ ] 2.1 定义BaseOperationParams基类
- [ ] 2.2 为基础操作实现参数模型
- [ ] 2.3 实现模型到JSONSchema的转换
- [ ] 2.4 实现类型检查和自动验证

### 阶段三：操作模块化重构

- [ ] 3.1 创建操作组基类
- [ ] 3.2 按功能将操作分组
- [ ] 3.3 实现操作动态注册机制
- [ ] 3.4 设计插件式加载结构

### 阶段四：装饰器优化

- [ ] 4.1 简化操作注册装饰器
- [ ] 4.2 增强文档字符串解析
- [ ] 4.3 自动生成操作元数据
- [ ] 4.4 优化示例代码生成

### 阶段五：迁移与集成

- [ ] 5.1 迁移现有操作到新结构
- [ ] 5.2 编写测试用例
- [ ] 5.3 确保向后兼容性
- [ ] 5.4 更新文档和注释

## 详细设计

### Pydantic模型设计

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

# 基础参数模型
class BaseOperationParams(BaseModel):
    page_id: Optional[str] = Field(
        None,
        description="浏览器页面ID，不提供则使用当前活动页面ID"
    )

# 具体操作参数模型示例
class GotoParams(BaseOperationParams):
    url: str = Field(..., description="要导航到的URL")
    wait_until: str = Field(
        "networkidle",
        description="何时认为导航完成，可选: 'load', 'domcontentloaded', 'networkidle'"
    )

# 操作结果模型
class OperationResult(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
```

### 操作注册机制设计

```python
from functools import wraps
from typing import Type, Callable, Dict, Any, Optional

def operation(
    name: Optional[str] = None,
    example: Optional[Dict[str, Any]] = None
):
    """简化的操作注册装饰器"""
    def decorator(func: Callable):
        # 获取函数的第一个类型注解参数(除self和browser外)
        sig = inspect.signature(func)
        params_class = None
        for param_name, param in list(sig.parameters.items())[2:]:  # 跳过self和browser
            if param.annotation != inspect.Parameter.empty:
                params_class = param.annotation
                break

        @wraps(func)
        async def wrapper(self, browser, params, *args, **kwargs):
            # 验证参数
            if params_class and not isinstance(params, params_class):
                # 尝试转换
                params = params_class(**params)
            return await func(self, browser, params, *args, **kwargs)

        # 存储操作元数据
        wrapper.operation_name = name or func.__name__.lstrip('_')
        wrapper.params_class = params_class
        wrapper.description = func.__doc__.split('\n')[0] if func.__doc__ else ""
        wrapper.example = example

        return wrapper
    return decorator
```

### 操作组基类设计

```python
from abc import ABC
import inspect
from typing import Dict, List, Any, ClassVar

class OperationGroup(ABC):
    """操作组基类，用于组织相关操作"""

    # 组信息
    group_name: ClassVar[str] = "base"
    group_description: ClassVar[str] = "基础操作组"

    # 注册表
    operations: ClassVar[Dict[str, Dict[str, Any]]] = {}

    @classmethod
    def register_operations(cls):
        """注册该组中的所有操作"""
        for name, method in inspect.getmembers(cls, inspect.ismethod):
            if hasattr(method, 'operation_name'):
                cls.operations[method.operation_name] = {
                    "handler": method,
                    "params_class": getattr(method, 'params_class', None),
                    "description": method.description,
                    "example": getattr(method, 'example', None)
                }

    @classmethod
    def get_operations(cls) -> Dict[str, Dict[str, Any]]:
        """获取该组中的所有操作"""
        if not cls.operations:
            cls.register_operations()
        return cls.operations
```
