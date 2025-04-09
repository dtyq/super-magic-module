#!/bin/bash

# 检查是否安装了 Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker first:"
    if [ "$(uname -s)" == "Darwin" ]; then
        echo "1. Visit https://docs.docker.com/desktop/install/mac-install/"
        echo "2. Download and install Docker Desktop for Mac"
    elif [ "$(uname -s)" == "Linux" ]; then
        echo "1. Visit https://docs.docker.com/engine/install/"
        echo "2. Follow the installation instructions for your Linux distribution"
    else
        echo "Please visit https://docs.docker.com/get-docker/ for installation instructions"
    fi
    exit 1
fi

# 检查 Docker 是否正在运行
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "Please start Docker and try again."
    if [ "$(uname -s)" == "Darwin" ]; then
        echo "1. Open Docker Desktop"
        echo "2. Wait for Docker to start"
    elif [ "$(uname -s)" == "Linux" ]; then
        echo "1. Start Docker service: sudo systemctl start docker"
    fi
    exit 1
fi

# 检查是否安装了 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed."
    echo "Please install docker-compose first:"
    if [ "$(uname -s)" == "Darwin" ]; then
        echo "1. Docker Desktop for Mac includes docker-compose by default"
        echo "2. If you're using an older version, visit https://docs.docker.com/compose/install/"
    elif [ "$(uname -s)" == "Linux" ]; then
        echo "1. Visit https://docs.docker.com/compose/install/"
        echo "2. Follow the installation instructions for your Linux distribution"
        echo "   For example, on Ubuntu/Debian:"
        echo "   sudo apt-get update"
        echo "   sudo apt-get install docker-compose-plugin"
    else
        echo "Please visit https://docs.docker.com/compose/install/ for installation instructions"
    fi
    exit 1
fi

# 检测系统架构
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        export PLATFORM=linux/amd64
        ;;
    aarch64|arm64|armv7l)
        export PLATFORM=linux/arm64
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# 如果是 macOS arm64 则不设置 PLATFORM
if [ "$(uname -s)" == "Darwin" ] && [ "$(uname -m)" == "arm64" ]; then
    export PLATFORM=""
fi

echo "Detected architecture: $ARCH, using platform: $PLATFORM"

# 判断 .env 是否存在，如果不存在复制 .env.example 到 .env
if [ ! -f .env ]; then
    cp .env.example .env
fi

# 修改 .env 的 PLATFORM 变量
if [ -n "$PLATFORM" ]; then
    if [ "$(uname -s)" == "Darwin" ]; then
        # macOS 版本
        sed -i '' "s/^PLATFORM=.*/PLATFORM=$PLATFORM/" .env
    else
        # Linux 版本
        sed -i "s/^PLATFORM=.*/PLATFORM=$PLATFORM/" .env
    fi
else
    # 如果 PLATFORM 为空，将其设置为空字符串
    if [ "$(uname -s)" == "Darwin" ]; then
        sed -i '' "s/^PLATFORM=.*/PLATFORM=/" .env
    else
        sed -i "s/^PLATFORM=.*/PLATFORM=/" .env
    fi
fi

# 检测公网IP并更新环境变量
detect_public_ip() {
    echo "正在检测公网IP..."
    
    # 尝试多种方法获取公网IP
    PUBLIC_IP=""
    
    # 方法1: 使用ipinfo.io
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null)
        if [ -z "$PUBLIC_IP" ] || [[ $PUBLIC_IP == *"html"* ]]; then
            PUBLIC_IP=""
        fi
    fi
    
    # 方法2: 使用ip.sb
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP=$(curl -s https://api.ip.sb/ip 2>/dev/null)
        if [ -z "$PUBLIC_IP" ] || [[ $PUBLIC_IP == *"html"* ]]; then
            PUBLIC_IP=""
        fi
    fi
    
    # 方法3: 使用ipify
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null)
        if [ -z "$PUBLIC_IP" ] || [[ $PUBLIC_IP == *"html"* ]]; then
            PUBLIC_IP=""
        fi
    fi
    
    # 如果成功获取公网IP，更新环境变量
    if [ -n "$PUBLIC_IP" ]; then
        echo "检测到公网IP: $PUBLIC_IP"
        echo "更新环境变量中..."
        
        # 更新MAGIC_SOCKET_BASE_URL和MAGIC_SERVICE_BASE_URL
        if [ "$(uname -s)" == "Darwin" ]; then
            # macOS版本
            sed -i '' "s|^MAGIC_SOCKET_BASE_URL=ws://localhost:9502|MAGIC_SOCKET_BASE_URL=ws://$PUBLIC_IP:9502|" .env
            sed -i '' "s|^MAGIC_SERVICE_BASE_URL=http://localhost:9501|MAGIC_SERVICE_BASE_URL=http://$PUBLIC_IP:9501|" .env
        else
            # Linux版本
            sed -i "s|^MAGIC_SOCKET_BASE_URL=ws://localhost:9502|MAGIC_SOCKET_BASE_URL=ws://$PUBLIC_IP:9502|" .env
            sed -i "s|^MAGIC_SERVICE_BASE_URL=http://localhost:9501|MAGIC_SERVICE_BASE_URL=http://$PUBLIC_IP:9501|" .env
        fi
        
        echo "环境变量已更新:"
        echo "MAGIC_SOCKET_BASE_URL=ws://$PUBLIC_IP:9502"
        echo "MAGIC_SERVICE_BASE_URL=http://$PUBLIC_IP:9501"
    else
        echo "未能检测到公网IP，保持默认设置。"
    fi
}

# 运行IP检测和更新
detect_public_ip

# 显示帮助信息
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start services in foreground"
    echo "  stop      Stop all services"
    echo "  daemon    Start services in background"
    echo "  restart   Restart all services"
    echo "  status    Show services status"
    echo "  logs      Show services logs"
    echo ""
    echo "If no command is provided, 'start' will be used by default."
}

# 启动服务
start_services() {
    echo "Starting services in foreground..."
    docker-compose up
}

# 停止服务
stop_services() {
    echo "Stopping services..."
    docker-compose down
}

# 后台启动服务
start_daemon() {
    echo "Starting services in background..."
    docker-compose up -d
}

# 重启服务
restart_services() {
    echo "Restarting services..."
    docker-compose restart
}

# 查看服务状态
show_status() {
    echo "Services status:"
    docker-compose ps
}

# 查看服务日志
show_logs() {
    echo "Showing services logs:"
    docker-compose logs -f
}

# 处理命令行参数
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    daemon)
        start_daemon
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            start_services
        else
            echo "Unknown command: $1"
            show_help
            exit 1
        fi
        ;;
esac 
