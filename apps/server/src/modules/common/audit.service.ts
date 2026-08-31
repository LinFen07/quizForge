import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'batch_delete' | 'batch_update';
export type AuditEntity = 'question' | 'tag' | 'knowledge_point' | 'practice';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    entity: AuditEntity;
    entityId: number;
    action: AuditAction;
    changes?: Record<string, { old: any; new: any }>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        changes: params.changes ? JSON.stringify(params.changes) : null,
      },
    });
  }

  async logBatch(params: {
    entity: AuditEntity;
    entityIds: number[];
    action: AuditAction;
    changes?: Record<string, { old: any; new: any }>;
  }) {
    return this.prisma.auditLog.createMany({
      data: params.entityIds.map((entityId) => ({
        entity: params.entity,
        entityId,
        action: params.action,
        changes: params.changes ? JSON.stringify(params.changes) : null,
      })),
    });
  }

  async findByEntity(entity: AuditEntity, entityId: number, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findRecent(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
