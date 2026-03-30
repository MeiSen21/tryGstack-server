import prisma from '../prisma/client';

/**
 * 测试数据库连接
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * 断开数据库连接
 */
export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('Database disconnected');
};

export { prisma };
