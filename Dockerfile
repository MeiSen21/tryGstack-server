# 使用 Node.js 20 版本作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制 package.json，利用缓存加速构建
COPY package*.json ./

# 安装依赖（只装生产环境需要的）
RUN npm ci --only=production

# 复制所有代码
COPY . .

# 暴露 3001 端口
EXPOSE 3001

# 启动命令
CMD ["node", "simple-server.js"]
