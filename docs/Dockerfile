ARG NODE_BASE_IMAGE=kkguan-registry-vpc.cn-shenzhen.cr.aliyuncs.com/open-source/node:18-alpine
ARG CADDY_BASE_IMAGE=kkguan-registry-vpc.cn-shenzhen.cr.aliyuncs.com/open-source/caddy:alpine

FROM ${NODE_BASE_IMAGE} AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . /app

RUN pnpm docs:build

FROM ${CADDY_BASE_IMAGE}

COPY --from=builder /app/.vitepress/dist /srv/dist/
COPY Caddyfile /Caddyfile

CMD ["caddy", "run", "--config", "/Caddyfile"]

EXPOSE 80
