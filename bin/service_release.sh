#!/usr/bin/env bash
set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# 获取 service 目录的绝对路径
SERVICE_DIR="$(cd "${SCRIPT_DIR}/../backend/magic-service" && pwd)"
# 获取根目录的绝对路径
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 加载环境变量
if [ -f "${ROOT_DIR}/.env" ]; then
    export $(grep -v '^#' "${ROOT_DIR}/.env" | xargs)
fi

# 使用环境变量获取Git仓库URL，默认使用GitHub
if [ -z "${GIT_REPO_URL}" ]; then
    # 如果环境变量未设置，使用默认值
    GIT_REPO_URL="git@github.com:dtyq"
fi
REMOTE_URL="${GIT_REPO_URL}/magic-service.git"

# 检查是否为GitHub仓库，如果不是则认为是GitLab仓库
IS_GITHUB=false
if [[ $REMOTE_URL == *"github"* ]]; then
    IS_GITHUB=true
fi

# 获取版本号或分支名
if (( "$#" == 1 )); then
    VERSION=$1
    # Always prepend with "v"
    if [[ $VERSION != v*  ]]; then
        VERSION="v$VERSION"
    fi
    USE_BRANCH=false
else
    if [[ $IS_GITHUB == false ]]; then
        # 如果不是GitHub且未提供版本号，则使用当前分支
        CURRENT_BRANCH=$(cd "${SERVICE_DIR}" && git rev-parse --abbrev-ref HEAD)
        echo "未提供版本号，将使用当前分支: ${CURRENT_BRANCH}"
        USE_BRANCH=true
    else
        echo "Tag has to be provided"
        exit 1
    fi
fi

NOW=$(date +%s)

# 添加确认环节，防止误发布
echo "准备发布到远程仓库: ${REMOTE_URL}"
if [[ $IS_GITHUB == true ]]; then
    echo "🔔 提示: 正在向GitHub仓库发布代码"
    echo "🔔 将使用版本: ${VERSION}"
else
    echo "🔔 提示: 正在向GitLab仓库发布代码"
    if [[ $USE_BRANCH == true ]]; then
        echo "🔔 将使用分支: ${CURRENT_BRANCH}"
    else
        echo "🔔 将使用版本: ${VERSION}"
    fi
fi

read -p "是否确认继续? (y/n): " confirm
if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "发布已取消"
    exit 0
fi

echo ""
echo ""
echo "Cloning magic-service";
TMP_DIR="/tmp/magic-split"

rm -rf $TMP_DIR;
mkdir $TMP_DIR;

(
    cd $TMP_DIR;
    git clone $REMOTE_URL;
    cd magic-service;
    
    # 获取默认分支名
    DEFAULT_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5);
    
    if [[ $USE_BRANCH == true ]]; then
        # 如果远程分支不存在，则基于默认分支创建新分支
        git checkout $DEFAULT_BRANCH
        git fetch origin $CURRENT_BRANCH || true
        if ! git branch -r | grep -q "origin/${CURRENT_BRANCH}$"; then
            echo "远程分支 ${CURRENT_BRANCH} 不存在，将创建新分支"
            git checkout -b $CURRENT_BRANCH
        else
            git checkout $CURRENT_BRANCH
        fi
        TARGET_BRANCH=$CURRENT_BRANCH
    else
        git checkout $DEFAULT_BRANCH
        TARGET_BRANCH=$DEFAULT_BRANCH
    fi

    # 复制 service 目录下的所有文件（包括隐藏文件）
    cp -a "${SERVICE_DIR}"/* .
    cp -a "${SERVICE_DIR}"/.gitignore ./
    cp -R "${SERVICE_DIR}"/.github ./
    cp -a "${SCRIPT_DIR}"/magic-service/Dockerfile.github ./
    # 判断是否是GitHub才执行这一步
    if [[ $IS_GITHUB == true ]]; then
        cp -a "${SCRIPT_DIR}"/magic-service/start.sh ./
    fi

    # 添加并提交更改
    git add .
    if [[ $USE_BRANCH == true ]]; then
        git commit -m "chore: update service files for branch ${CURRENT_BRANCH}"
    else
        git commit -m "chore: update service files for version ${VERSION}"
    fi

    # 根据不同情况推送代码
    if [[ $USE_BRANCH == true ]]; then
        echo "Pushing to branch ${TARGET_BRANCH}"
        git push origin $TARGET_BRANCH
    else
        if [[ $(git log --pretty="%d" -n 1 | grep tag --count) -eq 0 ]]; then
            echo "Releasing magic-service"
            git tag $VERSION
            git push origin $TARGET_BRANCH
            git push origin --tags
        fi
    fi
)

TIME=$(echo "$(date +%s) - $NOW" | bc)

printf "Execution time: %f seconds" $TIME