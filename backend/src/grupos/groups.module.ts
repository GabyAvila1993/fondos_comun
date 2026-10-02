import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./group.entity";
import { Deposit } from "./deposit.entity";
import { GroupDeleteProposal } from "./group-delete-proposal.entity";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { RelayerModule } from "../relayer/relayer.module";
import { UsersModule } from "../usuarios/users.module";
import { AuthModule } from "../autenticacion/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Group, Deposit, GroupDeleteProposal]), RelayerModule, UsersModule, AuthModule],
  providers: [GroupsService],
  controllers: [GroupsController],
})
export class GroupsModule {}
