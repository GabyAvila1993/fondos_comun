import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { GroupsModule } from "./groups/groups.module";
import { RelayerModule } from "./relayer/relayer.module";
import { User } from "./users/user.entity";
import { Group } from "./groups/group.entity";
import { Deposit } from "./groups/deposit.entity";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [User, Group, Deposit],
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
