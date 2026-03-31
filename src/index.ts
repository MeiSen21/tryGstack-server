import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { corsMiddleware } from './middleware/cors';
import { testConnection } from './config/database';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 中间件
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
    },
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('无法连接到数据库，服务器启动失败');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('🚀 Server is running!');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${NODE_ENV}`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // 关闭数据库连接
    const { disconnect } = await import('./config/database.js');
    await disconnect();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动服务器
startServer();
