#!/bin/bash

set -eo pipefail

# 获取脚本所在目录名称
base_dirname=$(
  cd "$(dirname "$0")"
  pwd
)
# 执行脚本文件位置
bin="${base_dirname}/bin/hyperf.php"


# 检查是否已经初始化过
if [ ! -f "${base_dirname}/.initialized" ]; then
    echo "Initializing magic-service for the first time..."
    
    # 执行 composer update
    cd ${base_dirname}
    composer update
    
    # 执行数据库种子
    php ${base_dirname}/bin/hyperf.php db:seed

    # ........................
    # 执行迁移
    php "${bin}" migrate --force
    
    # 创建标记文件，表示已经初始化过
    touch ${base_dirname}/.initialized
    echo "Initialization completed!"
else
    echo "magic-service has already been initialized, skipping..."
fi 


# 执行seeders

# 开启服务
USE_ZEND_ALLOC=0 php -dopcache.enable_cli=0 "${bin}" start
