import { ApiError } from '../types';

export class AppError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = '请求参数无效') {
    super('INVALID_REQUEST', message, 400);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权，请先登录') {
    super('UNAUTHORIZED', message, 401);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = '无权限访问该资源') {
    super('FORBIDDEN', message, 403);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super('NOT_FOUND', message, 404);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super('CONFLICT', message, 409);
  }
}

// 422 - Unprocessable Entity
export class ValidationError extends AppError {
  constructor(message: string = '数据验证失败') {
    super('VALIDATION_ERROR', message, 422);
  }
}

// 500 - Internal Server Error
export class InternalError extends AppError {
  constructor(message: string = '服务器内部错误') {
    super('INTERNAL_ERROR', message, 500);
  }
}
