import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { captchaService } from './captchaService';
import { 
  RegisterInput, 
  LoginInput, 
  AuthResponse, 
  UserWithoutPassword,
  GetUsersQuery,
  UpdateUserInput,
  PaginatedUsersResponse,
  UserListItem
} from '../types';
import { 
  ConflictError, 
  UnauthorizedError, 
  NotFoundError,
  BadRequestError,
  ForbiddenError
} from '../utils/errors';

export class AuthService {
  /**
   * 用户注册
   * @param data - 注册信息
   * @returns 用户信息和 Token
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, captchaId, captchaCode } = data;

    // 验证验证码
    const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!isCaptchaValid) {
      throw new BadRequestError('验证码错误或已过期');
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('该邮箱已被注册');
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户（默认 role=user, status=active）
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'user',
        status: 'active',
      },
    });

    // 生成 JWT Token（包含 role）
    const token = generateToken(user.id, user.role as 'admin' | 'user');

    // 返回用户信息和 Token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        role: userWithoutPassword.role as 'admin' | 'user',
        status: (userWithoutPassword.status as 'active' | 'disabled') || 'active',
      },
      token,
    };
  }

  /**
   * 用户登录
   * @param data - 登录信息
   * @returns 用户信息和 Token
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password, captchaId, captchaCode } = data;

    // 验证验证码
    const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!isCaptchaValid) {
      throw new BadRequestError('验证码错误或已过期');
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 检查用户状态
    if (user.status === 'disabled') {
      throw new UnauthorizedError('账户已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 生成 JWT Token（包含 role）
    const token = generateToken(user.id, user.role as 'admin' | 'user');

    // 返回用户信息和 Token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        role: userWithoutPassword.role as 'admin' | 'user',
        status: (userWithoutPassword.status as 'active' | 'disabled') || 'active',
      },
      token,
    };
  }

  /**
   * 根据 ID 获取用户信息
   * @param userId - 用户 ID
   * @returns 用户信息
   */
  async getUserById(userId: string): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: userWithoutPassword.role as 'admin' | 'user',
      status: (userWithoutPassword.status as 'active' | 'disabled') || 'active',
    };
  }

  /**
   * 检查邮箱是否可用
   * @param email - 邮箱地址
   * @returns 是否可用
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    return !existingUser;
  }

  // ==================== 管理员功能 ====================

  /**
   * 获取用户列表（分页）
   * @param query - 查询参数
   * @returns 分页用户列表
   */
  async getUsers(query: GetUsersQuery): Promise<PaginatedUsersResponse> {
    const { page = 1, pageSize = 10, username } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (username) {
      where.email = {
        contains: username,
        mode: 'insensitive', // 不区分大小写
      };
    }

    // 查询总数
    const total = await prisma.user.count({ where });

    // 查询用户列表
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      total,
      page,
      pageSize,
      list: users as UserListItem[],
    };
  }

  /**
   * 更新用户信息
   * @param userId - 用户 ID
   * @param data - 更新数据
   * @returns 更新后的用户信息
   */
  async updateUser(userId: string, data: UpdateUserInput): Promise<UserListItem> {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('用户不存在');
    }

    // 如果修改邮箱，检查是否已被使用
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        throw new ConflictError('该邮箱已被其他用户使用');
      }
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser as UserListItem;
  }

  /**
   * 删除用户
   * @param userId - 用户 ID
   */
  async deleteUser(userId: string): Promise<void> {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('用户不存在');
    }

    // 不能删除自己（通过中间件确保，这里做二次校验）
    // 在 controller 中会比较 req.userId 和 target userId

    // 删除用户（级联删除 workspaces）
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * 检查用户是否是管理员
   * @param userId - 用户 ID
   * @returns 是否是管理员
   */
  async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'admin';
  }
}

// 导出单例实例
export const authService = new AuthService();
