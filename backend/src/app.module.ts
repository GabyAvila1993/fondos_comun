import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./autenticacion/auth.module";
import { UsersModule } from "./usuarios/users.module";
import { GroupsModule } from "./grupos/groups.module";
import { RelayerModule } from "./relayer/relayer.module";
import { User } from "./usuarios/user.entity";
import { Group } from "./grupos/group.entity";
import { Deposit } from "./grupos/deposit.entity";
import { GroupDeleteProposal } from "./grupos/group-delete-proposal.entity";
import { NotificationsModule } from "./notificaciones/notifications.module";

import { Notification } from "./notificaciones/notification.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [User, Group, Deposit, GroupDeleteProposal, Notification],
      // synchronize:true es comodo para el prototipo del hackathon.
      // En produccion, usar migraciones en vez de sincronizar en caliente.
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    RelayerModule,
    NotificationsModule,
  ],
})
export class AppModule {}
