import { Request } from 'express';

// Prisma 类型定义（内联定义以避免模块导入问题）
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  config: any;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Express 扩展 ====================

export interface AuthRequest extends Request {
  userId?: string;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

// ==================== 用户相关类型 ====================

export interface RegisterInput {
  email: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}

export interface LoginInput {
  email: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;

// ==================== Workspace 相关类型 ====================

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  config?: WorkspaceConfig;
  isDefault?: boolean;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
  config?: WorkspaceConfig;
  isDefault?: boolean;
}

export interface WorkspaceConfig {
  charts?: ChartItem[];
  layout?: GridLayout[];
}

export interface ChartItem {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: DataPoint[];
  config: ChartConfig;
  position: GridPosition;
  createdAt: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  title: string;
  dimensions: string[];
  metrics: MetricConfig[];
  timeRange?: '7d' | '30d' | 'this_month' | '1y';
}

export interface MetricConfig {
  field: string;
  name: string;
  aggregation?: 'sum' | 'count' | 'avg';
}

export interface DataPoint {
  [key: string]: string | number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ==================== JWT 类型 ====================

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ==================== 环境变量类型 ====================

export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_URL: string;
}
