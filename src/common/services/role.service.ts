import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { UserRole } from 'src/types';
import { RedisService } from 'src/db/redis.service';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService
  ) {}

  async getRoleIdByName(role: UserRole): Promise<number | undefined> {
    const cacheKey = `role:name:${role}`;
    
    // Try to get from cache first
    const cachedRoleId = await this.redisService.get(cacheKey);
    if (cachedRoleId) {
      return parseInt(cachedRoleId);
    }

    const roleEntity = await this.prisma.role.findFirst({
      where: { name: role },
      select: { id: true },
    });

    if (roleEntity?.id) {
      await this.redisService.set(cacheKey, roleEntity.id.toString(), 3600);
      return roleEntity.id;
    }

    return undefined;
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async roleExists(role: UserRole) {
    const count = await this.prisma.role.count({
      where: { name: role },
    });

    return count > 0;
  }
}
