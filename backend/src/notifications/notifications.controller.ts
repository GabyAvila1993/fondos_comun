import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { PrivyAuthGuard } from "../auth/privy-auth.guard";
import { NotificationsService } from "./notifications.service";
import { UsersService } from "../users/users.service";

@Controller("notifications")
@UseGuards(PrivyAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getNotifications(@Req() req: any) {
    const user = await this.usersService.findOrCreate(req.privyUserId, "");
    return this.notificationsService.getForUser(user.id, 50); // Get up to 50 latest
  }

  @Post("read")
  async markRead(@Req() req: any, @Body() body: { ids: string[] }) {
    const user = await this.usersService.findOrCreate(req.privyUserId, "");
    await this.notificationsService.markAsRead(body.ids, user.id);
    return { success: true };
  }
}
