# ===== 基础镜像配置 =====
# 基础镜像: node:22-alpine
ARG NODE_IMAGE=node:22-alpine
# =================================================

# build
FROM ${NODE_IMAGE} as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY ./packages ./packages

RUN npm install pnpm --location=global && \
    # 安装 patch-package 是为了使 @feb/formily 能够正常装包
    npm install patch-package -g && \
    pnpm install

COPY . .

RUN pnpm build

# deploy
FROM ${NODE_IMAGE} as runner

# 在 runner 阶段重新定义环境变量
ARG CI_COMMIT_SHA
ARG CI_COMMIT_TAG
ENV MAGIC_APP_SHA=${CI_COMMIT_SHA}
ENV MAGIC_APP_VERSION=${CI_COMMIT_TAG}

WORKDIR /app


CMD ["node", "./server/app.cjs"]

EXPOSE 8080
