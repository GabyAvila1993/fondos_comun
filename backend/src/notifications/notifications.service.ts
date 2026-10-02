import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./notification.entity";
import { NotificationsGateway } from "./notifications.gateway";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway)) private gateway: NotificationsGateway
  ) {}

  async create(userId: string, type: string, title: string, message: string, groupId?: string) {
    const notif = this.repo.create({ userId, type, title, message, groupId });
    return this.repo.save(notif);
  }

  async emitAndSave(groupId: string | null, type: string, data: { message: string, targetUserId?: string, [key: string]: any }) {
    if (data.targetUserId) {
      const notif = await this.create(data.targetUserId, type, "Notificación", data.message, groupId || undefined);
      this.gateway.emitNotification(groupId || "global", type, { ...data, id: notif.id });
    } else {
      // It's meant for the whole group, but we don't have members list here directly. 
      // If we don't have targetUserId, we might just emit. 
      // In practice, we'll try to always pass targetUserId.
      this.gateway.emitNotification(groupId || "global", type, data);
    }
  }

  async getForUser(userId: string, limit: number = 20) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async markAsRead(ids: string[], userId: string) {
    if (!ids || ids.length === 0) return;
    await this.repo.createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where("id IN (:...ids) AND userId = :userId", { ids, userId })
      .execute();
  }
}
