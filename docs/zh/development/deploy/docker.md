
## 快速开始
支持Mac os 和Liunx 操作系统,
window 系统可以通过docker-compose运行
### 1. 克隆项目
```bash
git clone [项目地址]
cd magic
```

### 2. 配置环境变量
复制 `.env.example` 文件为 `.env`，并根据需要修改配置：
```bash
cp .env.example .env
```

### 3. 启动服务

```bash
# 在前台启动服务
./bin/magic.sh start
```

### 4. 其它命令

```bash
# 显示帮助信息
./bin/magic.sh help

# 在前台启动服务
./bin/magic.sh start

# 在后台启动服务
./bin/magic.sh daemon

# 停止服务
./bin/magic.sh stop

# 重启服务
./bin/magic.sh restart

# 查看服务状态
./bin/magic.sh status

# 查看服务日志
./bin/magic.sh logs
```

### 4. 访问服务
- API 服务: http://localhost:9501
- Web 应用: http://localhost:8080
  - 账号 `13800138001`：密码为 `123456`
  - 账号 `13800139001`：密码为 `123456`
- RabbitMQ 管理界面: http://localhost:15672
  - 用户名: admin
  - 密码: magic123456
- OpenSearch: https://localhost:9200
  - 用户名: admin
  - 密码: Qazwsxedc!@#123
- OpenSearch Dashboards: http://localhost:5601
  - 用户名: admin
  - 密码: Qazwsxedc!@#123