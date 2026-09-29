import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./group.entity";
import { Deposit } from "./deposit.entity";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { RelayerModule } from "../relayer/relayer.module";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Group, Deposit]), RelayerModule, UsersModule, AuthModule],
  providers: [GroupsService],
  controllers: [GroupsController],
})
export class GroupsModule {}
