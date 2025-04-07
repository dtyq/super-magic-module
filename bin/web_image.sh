#!/usr/bin/env bash


### web 本地构建镜像


set -e

# determine swoole version to build.
TASK=${1}
TAG=${2}
CHECK=${!#}


export WEB_IMAGE="dtyq/magic-web"
export REGISTRY="ghcr.io"

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# 获取 service 目录的绝对路径
SERVICE_DIR="$(cd "${SCRIPT_DIR}/../frontend/magic-web" && pwd)"

function publish() {
    echo "Publishing "$TAG" ..."
    # Push origin image
    docker push ${REGISTRY}"/"${WEB_IMAGE}":"${TAG}

    echo -e "\n"
}

# 检查并安装 buildx
check_and_install_buildx() {
    if ! docker buildx version > /dev/null 2>&1; then
        echo "未检测到 Docker Buildx，正在尝试安装..."
        
        # 检测操作系统并安装
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "检测到 Linux 系统，开始安装 Buildx..."
            # Linux 安装方法
            mkdir -p ~/.docker/cli-plugins/
            BUILDX_URL="https://github.com/docker/buildx/releases/download/v0.10.4/buildx-v0.10.4.linux-amd64"
            if ! curl -sSL "$BUILDX_URL" -o ~/.docker/cli-plugins/docker-buildx; then
                echo "下载 Buildx 失败，请检查网络连接或手动安装: https://docs.docker.com/go/buildx/"
                exit 1
            fi
            chmod +x ~/.docker/cli-plugins/docker-buildx
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "检测到 macOS 系统，建议使用 Homebrew 安装 Buildx..."
            read -p "是否使用 Homebrew 安装 Docker Buildx? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if ! command -v brew &> /dev/null; then
                    echo "未检测到 Homebrew，请先安装 Homebrew: https://brew.sh/"
                    exit 1
                fi
                brew install docker-buildx
            else
                echo "请手动安装 Docker Buildx: https://docs.docker.com/go/buildx/"
                exit 1
            fi
        else
            echo "不支持的操作系统，请手动安装 Docker Buildx: https://docs.docker.com/go/buildx/"
            exit 1
        fi
        
        # 验证安装
        if docker buildx version > /dev/null 2>&1; then
            echo "Docker Buildx 安装成功: $(docker buildx version | head -n 1)"
        else
            echo "Docker Buildx 安装失败，请手动安装: https://docs.docker.com/go/buildx/"
            exit 1
        fi
    else
        echo "Docker Buildx 已安装: $(docker buildx version | head -n 1)"
    fi
}

# build base image
if [[ ${TASK} == "build" ]]; then
    # 检查并安装 buildx
    check_and_install_buildx
    
    
    # 启用 BuildKit
    export DOCKER_BUILDKIT=1
    
    echo "正在构建镜像: ${REGISTRY}/${WEB_IMAGE}:${TAG}"
    docker build -t ${REGISTRY}"/"${WEB_IMAGE}":"${TAG} -f ./frontend/magic-web/Dockerfile.web ./frontend/magic-web
fi

if [[ ${TASK} == "publish" ]]; then
    # Push base image
    publish $TAG  
fi