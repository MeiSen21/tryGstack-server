import prisma from '../prisma/client';
import type { Workspace } from '../types';
import { 
  CreateWorkspaceInput, 
  UpdateWorkspaceInput,
  WorkspaceConfig 
} from '../types';
import { 
  NotFoundError, 
  ForbiddenError,
  BadRequestError 
} from '../utils/errors';

export class WorkspaceService {
  /**
   * 获取用户的所有 Workspace
   * @param userId - 用户 ID
   * @returns Workspace 列表
   */
  async findAllByUser(userId: string): Promise<Workspace[]> {
    return prisma.workspace.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * 根据 ID 获取 Workspace
   * @param id - Workspace ID
   * @param userId - 用户 ID
   * @returns Workspace
   */
  async findById(id: string, userId: string): Promise<Workspace> {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace 不存在');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenError('无权访问该 Workspace');
    }

    return workspace;
  }

  /**
   * 创建 Workspace
   * @param userId - 用户 ID
   * @param data - 创建数据
   * @returns 创建的 Workspace
   */
  async create(userId: string, data: CreateWorkspaceInput): Promise<Workspace> {
    const { name, description, config, isDefault = false } = data;

    // 验证名称
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Workspace 名称不能为空');
    }

    // 如果设为默认，取消其他默认 Workspace
    if (isDefault) {
      await this.clearDefaultWorkspace(userId);
    }

    // 如果用户还没有 Workspace，将第一个设为默认
    const userWorkspacesCount = await prisma.workspace.count({
      where: { userId },
    });

    const shouldBeDefault = isDefault || userWorkspacesCount === 0;

    return prisma.workspace.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        config: (config as any) || {},
        isDefault: shouldBeDefault,
        userId,
      },
    });
  }

  /**
   * 更新 Workspace
   * @param id - Workspace ID
   * @param userId - 用户 ID
   * @param data - 更新数据
   * @returns 更新后的 Workspace
   */
  async update(
    id: string, 
    userId: string, 
    data: UpdateWorkspaceInput
  ): Promise<Workspace> {
    // 验证所有权
    const workspace = await this.findById(id, userId);

    const { name, description, config, isDefault } = data;

    // 如果修改名称，验证有效性
    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError('Workspace 名称不能为空');
      }
    }

    // 如果设为默认，取消其他默认 Workspace
    if (isDefault && !workspace.isDefault) {
      await this.clearDefaultWorkspace(userId);
    }

    return prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(config !== undefined && { config: config as any }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  }

  /**
   * 删除 Workspace
   * @param id - Workspace ID
   * @param userId - 用户 ID
   */
  async delete(id: string, userId: string): Promise<void> {
    // 验证所有权
    await this.findById(id, userId);

    await prisma.workspace.delete({
      where: { id },
    });

    // 如果删除的是默认 Workspace，将最新的设为默认
    const remainingWorkspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });

    if (remainingWorkspaces.length > 0) {
      await prisma.workspace.update({
        where: { id: remainingWorkspaces[0].id },
        data: { isDefault: true },
      });
    }
  }

  /**
   * 设置默认 Workspace
   * @param id - Workspace ID
   * @param userId - 用户 ID
   * @returns 更新后的 Workspace
   */
  async setDefault(id: string, userId: string): Promise<Workspace> {
    // 验证所有权
    const workspace = await this.findById(id, userId);

    // 如果已经是默认，直接返回
    if (workspace.isDefault) {
      return workspace;
    }

    // 取消其他默认 Workspace
    await this.clearDefaultWorkspace(userId);

    // 设置当前为默认
    return prisma.workspace.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * 获取用户的默认 Workspace
   * @param userId - 用户 ID
   * @returns 默认 Workspace 或 null
   */
  async getDefault(userId: string): Promise<Workspace | null> {
    return prisma.workspace.findFirst({
      where: { userId, isDefault: true },
    });
  }

  /**
   * 清除用户的默认 Workspace
   * @param userId - 用户 ID
   */
  private async clearDefaultWorkspace(userId: string): Promise<void> {
    await prisma.workspace.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  /**
   * 更新 Workspace 配置
   * @param id - Workspace ID
   * @param userId - 用户 ID
   * @param config - 配置数据
   * @returns 更新后的 Workspace
   */
  async updateConfig(
    id: string, 
    userId: string, 
    config: WorkspaceConfig
  ): Promise<Workspace> {
    // 验证所有权
    await this.findById(id, userId);

    return prisma.workspace.update({
      where: { id },
      data: {
        config: config as any,
      },
    });
  }
}

// 导出单例实例
export const workspaceService = new WorkspaceService();
