import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsGateway } from "./notifications.gateway";
import { Notification } from "./notification.entity";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UsersModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}
