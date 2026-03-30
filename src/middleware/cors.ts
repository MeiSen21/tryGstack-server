import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',  // Vite 默认开发端口
  'http://localhost:3000',  // 常见开发端口
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// 从环境变量添加允许的域名
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如移动端应用或 curl）
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400, // 24 小时
});

export default corsMiddleware;
