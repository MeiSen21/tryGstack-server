import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';

// 默认权限配置
const defaultPermissions = {
  menus: {
    datacenter: true,
    userManagement: false,
  },
  features: {
    workspace: { create: 'visible', edit: 'visible', delete: 'visible' },
    chartCreate: { getRecommendation: 'visible' },
    chart: { editTitle: 'visible', delete: 'visible', refresh: 'visible' },
  },
};

// 管理员默认权限
const adminPermissions = {
  menus: {
    datacenter: true,
    userManagement: true,
  },
  features: {
    workspace: { create: 'visible', edit: 'visible', delete: 'visible' },
    chartCreate: { getRecommendation: 'visible' },
    chart: { editTitle: 'visible', delete: 'visible', refresh: 'visible' },
  },
};

/**
 * 权限控制器
 */
export class PermissionController {
  /**
   * 获取用户权限配置
   */
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, permissions: true },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 如果没有自定义权限，返回默认权限
      const permissions = (user.permissions as any) || 
        (user.role === 'admin' ? adminPermissions : defaultPermissions);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户权限配置
   */
  async updateUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 更新用户权限
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { permissions: permissions as any },
        select: { id: true, email: true, permissions: true },
      });

      res.json({
        success: true,
        data: updatedUser.permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取权限配置 Schema
   * 用于前端动态渲染权限配置界面
   */
  async getPermissionsSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = {
        menus: [
          { key: 'datacenter', label: '数据中心', description: '数据中心菜单可见性' },
          { key: 'userManagement', label: '用户管理', description: '用户管理菜单可见性（仅管理员）' },
        ],
        features: [
          {
            component: 'workspace',
            label: '当前工作区',
            actions: [
              { key: 'create', label: '新建工作区', description: '创建新工作区按钮' },
              { key: 'edit', label: '编辑工作区', description: '编辑工作区名称按钮' },
              { key: 'delete', label: '删除工作区', description: '删除工作区按钮' },
            ],
          },
          {
            component: 'chartCreate',
            label: '新建图表',
            actions: [
              { key: 'getRecommendation', label: '获取推荐', description: 'AI 推荐图表按钮' },
            ],
          },
          {
            component: 'chart',
            label: '图表操作',
            actions: [
              { key: 'editTitle', label: '编辑标题', description: '编辑图表标题按钮' },
              { key: 'delete', label: '删除图表', description: '删除图表按钮' },
              { key: 'refresh', label: '刷新数据', description: '刷新图表数据按钮' },
            ],
          },
        ],
      };

      res.json({
        success: true,
        data: schema,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重置用户权限为默认值
   */
  async resetUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      const defaultPerms = user.role === 'admin' ? adminPermissions : defaultPermissions;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { permissions: defaultPerms as any },
        select: { id: true, email: true, permissions: true },
      });

      res.json({
        success: true,
        data: updatedUser.permissions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();
