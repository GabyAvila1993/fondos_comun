import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { RelayerService } from "../relayer/relayer.service";
import { UsersService } from "../users/users.service";
import { PrivyAuthGuard } from "../auth/privy-auth.guard";
import { PrivyService } from "../auth/privy.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";

/**
 * Todos estos endpoints reciben la FIRMA que el usuario ya hizo en el
 * frontend (gratis, con su wallet invisible de Privy) y solo se encargan
 * de pasarsela al RelayerService, que es quien manda la transaccion real
 * pagando el gas. El backend nunca firma "como si fuera" el usuario: solo
 * reenvia lo que el usuario ya firmo.
 */
@Controller("groups")
@UseGuards(PrivyAuthGuard)
export class GroupsController {
  constructor(
    private groups: GroupsService,
    private relayer: RelayerService,
    private users: UsersService,
    private privy: PrivyService,
    private notifications: NotificationsGateway,
  ) {}

  /** Resuelve el usuario local (creandolo si es su primera vez) a partir del token de Privy. */
  private async currentUser(req: any) {
    const privyUser = await this.privy.getUser(req.privyUserId);
    return this.users.findOrCreate(privyUser.privyUserId, privyUser.walletAddress!, privyUser.email);
  }

  @Get()
  async list(@Req() req: any) {
    const user = await this.currentUser(req);
    return this.groups.findAllForUser(user.id);
  }

  @Get("stats/me")
  async getMyStats(@Req() req: any) {
    const user = await this.currentUser(req);
    return this.groups.getUserStats(user.id);
  }

  @Get(":id")
  async getOne(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    const state = await this.relayer.getGroupState(group!.contractAddress, user.walletAddress);
    const deposits = await this.groups.getDepositsForGroup(group!.id);
    
    const memberUsers = await this.users.findMany(group!.members || []);
    const usersMap: Record<string, {name?: string, email?: string}> = {};
    for (const u of memberUsers) {
      usersMap[u.id] = { name: u.name, email: u.email };
      if (u.walletAddress) {
        usersMap[u.walletAddress.toLowerCase()] = { name: u.name, email: u.email };
      }
    }
    
    return { ...group, ...state, deposits, usersMap };
  }

  /** Estado real del fondo, leído en vivo desde Monad: balance, límites y feed de movimientos. */
  @Get(":id/state")
  async state(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    const onchain = await this.relayer.getGroupState(group!.contractAddress, user.walletAddress);
    const deposits = await this.groups.getDepositsForGroup(group!.id);

    const memberUsers = await this.users.findMany(group!.members || []);
    const usersMap: Record<string, {name?: string, email?: string}> = {};
    for (const u of memberUsers) {
      usersMap[u.id] = { name: u.name, email: u.email };
      if (u.walletAddress) {
        usersMap[u.walletAddress.toLowerCase()] = { name: u.name, email: u.email };
      }
    }

    return { id: group!.id, contractAddress: group!.contractAddress, ...onchain, deposits, usersMap };
  }

  @Post()
  async createGroup(@Req() req: any, @Body() body: { name: string; creditLimit: string; dailyLimit: number }) {
    const user = await this.currentUser(req);
    return this.groups.create(body.name, user.id, user.walletAddress, body.creditLimit, body.dailyLimit);
  }

  /** Paso 1 del flujo "unirme/gastar/votar": el front pide el nonce actual para armar la firma. */
  @Get(":id/nonce")
  async getNonce(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    const nonce = await this.relayer.getNonce(group!.contractAddress, user.walletAddress);
    return { nonce: nonce.toString() };
  }

  @Post(":id/join")
  async join(@Req() req: any, @Param("id") groupId: string, @Body() body: { nonce: string; signature: string }) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.relayer.joinGroup(group!.contractAddress, user.walletAddress, BigInt(body.nonce), body.signature);
    await this.groups.addMember(groupId, user.id);
    return { ok: true };
  }

  /** Deposito fiat -> el backend de pagos (Mercado Pago/banco) confirma y llama esto. */
  @Post(":id/deposit")
  async deposit(@Req() req: any, @Param("id") groupId: string, @Body() body: { fiatAmount: number }) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.groups.recordDeposit(user.id, group!.id, body.fiatAmount);
    await this.relayer.depositFiatAsOnchain(group!.contractAddress, body.fiatAmount);
    
    const userName = user.name || (user.email ? user.email.split('@')[0] : 'Alguien');
    this.notifications.emitNotification(group!.id, "new_movement", {
      type: "deposit",
      message: `${userName} ingresó $${body.fiatAmount} al fondo común.`
    });
    return { ok: true };
  }

  @Post(":id/expense")
  async expense(
    @Req() req: any,
    @Param("id") groupId: string,
    @Body() body: { amountMon: string; desc: string; forceApproval: boolean; nonce: string; signature: string },
  ) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.relayer.requestExpense(
      group!.contractAddress,
      user.walletAddress,
      body.amountMon,
      body.desc,
      body.forceApproval,
      BigInt(body.nonce),
      body.signature,
    );

    this.notifications.emitNotification(group!.id, "new_movement", {
      type: "expense",
      message: `${user.email || user.name || 'Un miembro'} generó un gasto: ${body.desc} por $${Number(body.amountMon) * 1000}`
    });

    return { ok: true };
  }

  @Post(":id/vote")
  async vote(
    @Req() req: any,
    @Param("id") groupId: string,
    @Body() body: { txId: number; approve: boolean; nonce: string; signature: string },
  ) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.relayer.vote(group!.contractAddress, user.walletAddress, body.txId, body.approve, BigInt(body.nonce), body.signature);
    
    this.notifications.emitNotification(group!.id, "vote", {
      type: "vote",
      message: `${user.email || user.name || 'Un miembro'} votó ${body.approve ? 'a favor' : 'en contra'} del gasto #${body.txId}`
    });

    return { ok: true };
  }
}
