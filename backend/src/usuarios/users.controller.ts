import { Controller, Put, Body, Req, UseGuards } from "@nestjs/common";
import { PrivyAuthGuard } from "../autenticacion/privy-auth.guard";
import { UsersService } from "./users.service";
import { PrivyService } from "../autenticacion/privy.service";

@Controller("users")
@UseGuards(PrivyAuthGuard)
export class UsersController {
  constructor(
    private users: UsersService,
    private privy: PrivyService,
  ) {}

  @Put("me")
  async updateProfile(@Req() req: any, @Body() body: { name: string }) {
    const privyUser = await this.privy.getUser(req.privyUserId);
    const user = await this.users.findOrCreate(
      privyUser.privyUserId,
      privyUser.walletAddress!,
      privyUser.email,
      privyUser.name
    );
    return this.users.updateName(user.id, body.name);
  }
}
