# 改进filebase处理Excel合并单元格功能的方案

## 需求分析
- 当前filebase的Excel解析器在处理合并单元格时存在一定限制
- 在pandas读取Excel文件时，合并单元格的值只出现在第一个单元格中，其余位置被填充为NaN
- 需要在建立索引时能够正确处理合并单元格的情况，避免信息丢失
- 考虑保留合并单元格的关系结构，使索引更加准确

## 实现方案

### 方案一：使用pandas的填充方法
在使用pandas读取Excel文件后，使用填充方法(fillna)处理合并单元格：

1. 检测数据中的NaN值，判断是否可能是合并单元格导致
2. 使用`fillna(method='ffill')`进行前向填充
3. 对行列数据分别进行填充处理

```python
# 处理行方向的合并单元格
df = df.fillna(method='ffill', axis=0)

# 处理列方向的合并单元格
df = df.fillna(method='ffill', axis=1)
```

**优点**：实现简单，pandas原生支持
**缺点**：无法区分有意为空的单元格和合并单元格，可能导致错误填充

### 方案二：使用openpyxl直接获取合并单元格信息
使用openpyxl库读取Excel文件的合并单元格信息，并手动填充相应的值：

1. 使用pandas读取基本数据
2. 使用openpyxl加载同一文件获取合并单元格信息
3. 根据合并单元格信息，将首个单元格的值填充到整个合并区域

```python
import pandas as pd
from openpyxl import load_workbook

# 使用pandas读取Excel
df = pd.read_excel(file_path, sheet_name=sheet_name)

# 使用openpyxl读取合并单元格信息
wb = load_workbook(file_path)
ws = wb[sheet_name]

# 遍历所有合并单元格区域
for merged_range in ws.merged_cells.ranges:
    # 获取合并区域的首个单元格值
    start_cell = merged_range.start_cell
    start_value = start_cell.value
    
    # 获取合并区域的边界
    min_row, min_col, max_row, max_col = merged_range.bounds
    
    # 填充合并区域中的所有单元格
    for row in range(min_row-1, max_row):
        for col in range(min_col-1, max_col):
            # pandas和openpyxl的索引差异调整
            df.iat[row, col] = start_value
```

**优点**：准确识别合并单元格，不会错误填充有意为空的单元格
**缺点**：实现复杂，需要额外加载文件，可能影响性能

### 方案三：使用pandas的选项参数
探索pandas `read_excel` 函数的参数选项，如使用 `index_col` 参数处理部分合并单元格情况：

```python
# 对于某些特定情况，设置index_col参数为列表可以处理合并单元格
df = pd.read_excel(file_path, index_col=[0])
```

**优点**：使用pandas内置功能，不需要额外处理
**缺点**：适用场景有限，不能处理所有合并单元格情况

## 实现步骤
1. 在filebase的Excel解析器中添加合并单元格检测功能
2. 实现方案二作为主要解决方案，同时提供方案一作为备选
3. 针对索引构建流程进行优化，确保合并单元格信息被正确处理
4. 添加相关元数据，记录合并单元格的位置和关系
5. 更新相关日志和异常处理，确保处理过程透明可追踪

## 代码修改位置
- `app/filebase/parsers/excel_parser.py`中的`_parse_excel`方法
- 考虑添加新的辅助方法，如`_handle_merged_cells`
- 可能需要修改`FileChunk`类，添加对合并单元格信息的支持

## 注意事项
- 需要处理大型Excel文件中包含大量合并单元格的性能问题
- 对于不同版本Excel文件(.xls, .xlsx)的兼容性处理
- 考虑复杂合并单元格结构（嵌套合并、交叉合并等）的处理
- 确保修改不影响现有功能，添加足够的测试用例验证

## 预期效果
修改完成后，filebase将能够：
1. 正确识别和处理Excel文件中的合并单元格
2. 在索引中保留合并单元格的结构和语义
3. 提供更准确的文档搜索和检索结果
4. 改善对包含合并单元格的Excel文件的处理效率

## 优先级和时间估计
- 优先级：中
- 预计工作量：3-5人天
- 建议实施阶段：在当前Excel解析功能稳定后进行扩展 