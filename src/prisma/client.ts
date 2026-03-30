// Prisma Client - 使用 CommonJS 方式导入以兼容 tsx
const { PrismaClient } = require('@prisma/client');

declare global {
  var __prisma: any | undefined;
}

const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
export { prisma };
