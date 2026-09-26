import { Module } from "@nestjs/common";
import { PrivyService } from "./privy.service";
import { PrivyAuthGuard } from "./privy-auth.guard";

@Module({
  providers: [PrivyService, PrivyAuthGuard],
  exports: [PrivyService, PrivyAuthGuard],
})
export class AuthModule {}
