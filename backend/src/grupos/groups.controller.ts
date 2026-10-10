import { Body, Controller, Delete, Get, Param, Post, Patch, Req, UseGuards, BadRequestException, NotFoundException } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { RelayerService } from "../relayer/relayer.service";
import { UsersService } from "../usuarios/users.service";
import { PrivyAuthGuard } from "../autenticacion/privy-auth.guard";
import { PrivyService } from "../autenticacion/privy.service";
import { NotificationsService } from "../notificaciones/notifications.service";
import { ethers } from "ethers";

/**
 * Todos estos endpoints reciben la FIRMA que el usuario ya hizo en el
 * frontend (gratis, con su wallet invisible de Privy) y solo se encargan
 * de pasarsela al RelayerService, que es quien manda la transaccion real
 * pagando el gas. El backend nunca firma "como si fuera" el usuario: solo
 * reenvia lo que el usuario ya firmo.
 */

function formatName(user: any, fallback: string = 'Un miembro'): string {
  if (!user) return fallback;
  if (user.name && !user.name.includes('@')) return user.name;
  if (user.email) return user.email.split('@')[0];
  if (user.name) return user.name.split('@')[0];
  return fallback;
}

@Controller("groups")

@UseGuards(PrivyAuthGuard)
export class GroupsController {
  constructor(
    private groups: GroupsService,
    private relayer: RelayerService,
    private users: UsersService,
    private privy: PrivyService,
    private notifications: NotificationsService,
  ) {}

  /** Resuelve el usuario local (creandolo si es su primera vez) a partir del token de Privy. */
  private async currentUser(req: any) {
    const privyUser = await this.privy.getUser(req.privyUserId);
    return this.users.findOrCreate(privyUser.privyUserId, privyUser.walletAddress!, privyUser.email, privyUser.name);
  }

  @Get()
  async list(@Req() req: any) {
    const user = await this.currentUser(req);
    const groups = await this.groups.findAllForUser(user.id);
    const result = [];
    for (const g of groups) {
      const deleteProposals = await this.groups.getDeleteProposalsForGroup(g.id);
      result.push({ ...g, isCreator: g.creatorUserId === user.id, deleteProposals, currentUserId: user.id });
    }
    return result;
  }

  @Get("stats/me")
  async getMyStats(@Req() req: any) {
    const user = await this.currentUser(req);
    const stats = await this.groups.getUserStats(user.id);
    return { stats, currentUserId: user.id };
  }

  @Get(":id")
  async getOne(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    if (!group) throw new NotFoundException("Grupo no encontrado");
    let state: any = {
      name: group.name,
      creditLimit: "0",
      dailyLimit: 0,
      majorityNeeded: 0,
      balance: "0",
      transactions: [],
      pending: [],
      limitProposals: [],
      pendingLimitProposals: [],
    };
    try {
      state = await this.relayer.getGroupState(group!.contractAddress, user.walletAddress);
    } catch (e: any) {
      console.error(`Could not fetch group state for ${group!.contractAddress}:`, e.message);
    }
    const deposits = await this.groups.getDepositsForGroup(group!.id);
    
    const memberUsers = await this.users.findMany(group!.members || []);
    const usersMap: Record<string, {name?: string, email?: string, walletAddress?: string}> = {};
    for (const u of memberUsers) {
      usersMap[u.id] = { name: u.name, email: u.email, walletAddress: u.walletAddress };
      if (u.walletAddress) {
        usersMap[u.walletAddress.toLowerCase()] = { name: u.name, email: u.email, walletAddress: u.walletAddress };
      }
    }
    const deleteProposals = await this.groups.getDeleteProposalsForGroup(group!.id);
    return { ...group, creatorUserId: group!.creatorUserId, ...state, name: group!.name, deposits, usersMap, deleteProposals };
  }

  /** Estado real del fondo, leído en vivo desde Monad: balance, limites y feed de movimientos. */
  @Get(":id/state")
  async state(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    let onchain: any = {
      name: group!.name,
      creditLimit: "0",
      dailyLimit: 0,
      majorityNeeded: 0,
      balance: "0",
      transactions: [],
      pending: [],
      limitProposals: [],
      pendingLimitProposals: [],
    };
    try {
      onchain = await this.relayer.getGroupState(group!.contractAddress, user.walletAddress);
    } catch (e) {
      console.warn(`Could not fetch group state for ${group!.contractAddress}`);
    }
    const deposits = await this.groups.getDepositsForGroup(group!.id);
    const deleteProposals = await this.groups.getDeleteProposalsForGroup(group!.id);

    const memberUsers = await this.users.findMany(group!.members || []);
    const usersMap: Record<string, {name?: string, email?: string, walletAddress?: string}> = {};
    for (const u of memberUsers) {
      usersMap[u.id] = { name: u.name, email: u.email, walletAddress: u.walletAddress };
      if (u.walletAddress) {
        usersMap[u.walletAddress.toLowerCase()] = { name: u.name, email: u.email, walletAddress: u.walletAddress };
      }
    }

    return { id: group!.id, contractAddress: group!.contractAddress, creatorUserId: group!.creatorUserId, isCreator: group!.creatorUserId === user.id, members: group!.members, ...onchain, name: group!.name, deposits, deleteProposals, usersMap };
  }

  @Post()
  async createGroup(@Req() req: any, @Body() body: { name: string; creditLimit: string; dailyLimit: number }) {
    const user = await this.currentUser(req);
    return this.groups.create(body.name, user.id, user.walletAddress, body.creditLimit, body.dailyLimit);
  }

  /** Paso 1 del flujo "unirme/gastar/vot��ar": el front pide el nonce actual para armar la firma. */
  @Get(":id/nonce")
  async getNonce(@Req() req: any, @Param("id") groupId: string) {
    try {
      const user = await this.currentUser(req);
      const group = await this.groups.findOne(groupId);
      const nonce = await this.relayer.getNonce(group!.contractAddress, user.walletAddress);
      return { nonce: nonce.toString() };
    } catch (err: any) {
      throw new BadRequestException("Este grupo utiliza una versión antigua del contrato que no soporta esta función. Por favor, crea un nuevo grupo.");
    }
  }

  @Post(":id/join")
  async join(@Req() req: any, @Param("id") groupId: string, @Body() body: { nonce: string; signature: string }) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.relayer.joinGroup(group!.contractAddress, user.walletAddress, BigInt(body.nonce), body.signature);
    await this.groups.addMember(groupId, user.id);
    const updatedGroup = await this.groups.findOne(groupId);
    const userName = user.name || (user.email ? user.email.split('@')[0] : 'Alguien');
    this.notifications.emitAndSave(groupId, "system", { targetUserIds: updatedGroup!.members, 
      type: "system",
      groupId: groupId,
      message: `CAMBIO EN EL GRUPO ${updatedGroup!.name}: ${userName} se ha unido al grupo.`
    });
    
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
    this.notifications.emitAndSave(group!.id, "new_movement", { targetUserIds: group!.members, 
      type: "deposit",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${userName} ingres� ${body.fiatAmount} al fondo comun.`
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
      user.walletAddress, ethers.parseUnits(body.amountMon, 6).toString(), body.desc,
      body.forceApproval,
      BigInt(body.nonce),
      body.signature,
    );

    this.notifications.emitAndSave(group!.id, "new_movement", { targetUserIds: group!.members, 
      type: "expense",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'Un miembro')} genero un gasto: ${body.desc} por ${Number(body.amountMon) * 1000}`
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
    
    this.notifications.emitAndSave(group!.id, "vote", { targetUserIds: group!.members, 
      type: "vote",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'Un miembro')} voto ${body.approve ? 'a favor' : 'en contra'} del gasto #${body.txId}`
    });

    return { ok: true };
  }

  @Post(":id/limit-proposal")
  async proposeLimit(
    @Req() req: any,
    @Param("id") groupId: string,
    @Body() body: { newLimit: string; nonce: string; signature: string },
  ) {
    try {
      const user = await this.currentUser(req);
      const group = await this.groups.findOne(groupId);
      await this.relayer.proposeLimitChange(
        group!.contractAddress,
        user.walletAddress,
        body.newLimit,
        BigInt(body.nonce),
        body.signature,
      );
      this.notifications.emitAndSave(group!.id, "limit_proposal", { targetUserIds: group!.members, 
        type: "limit_proposal",
        message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'El creador')} propuso un nuevo limite de retiro de ${body.newLimit}`,
      });
      return { ok: true };
    } catch (err: any) {
      throw new BadRequestException(err.message || String(err));
    }
  }

  @Post(":id/limit-vote")
  async voteLimit(
    @Req() req: any,
    @Param("id") groupId: string,
    @Body() body: { proposalId: number; approve: boolean; nonce: string; signature: string },
  ) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    await this.relayer.voteLimitChange(
      group!.contractAddress,
      user.walletAddress,
      body.proposalId,
      body.approve,
      BigInt(body.nonce),
      body.signature,
    );
    this.notifications.emitAndSave(group!.id, "vote", { targetUserIds: group!.members, 
      type: "vote",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'Un miembro')} voto ${body.approve ? 'a favor' : 'en contra'} del cambio de limite #${body.proposalId}`,
    });
    return { ok: true };
  }

  @Delete(":id")
  async deleteGroup(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    return this.groups.remove(groupId, user.id);
  }

  @Post(":id/propose-delete")
  async proposeDeleteGroup(@Req() req: any, @Param("id") groupId: string) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    const proposal = await this.groups.proposeDelete(groupId, user.id);
    
    this.notifications.emitAndSave(groupId, "system", { targetUserIds: group!.members, 
      type: "system",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'El creador')} propuso eliminar el grupo.`,
    });
    
    return proposal;
  }

  
  @Delete(':id/propose-delete')
  async clearDeleteProposal(@Req() req: any, @Param('id') groupId: string) {
    const user = await this.currentUser(req);
    await this.groups.clearDeleteProposal(groupId, user.id);
    return { ok: true };
  }

  @Post(":id/vote-delete")
  async voteDeleteGroup(@Req() req: any, @Param("id") groupId: string, @Body() body: { proposalId: string; approve: boolean }) {
    const user = await this.currentUser(req);
    const group = await this.groups.findOne(groupId);
    const proposal = await this.groups.voteDelete(body.proposalId, user.id, body.approve);
    
    this.notifications.emitAndSave(groupId, "system", { targetUserIds: group!.members, 
      type: "system",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'Un miembro')} voto ${body.approve ? 'a favor' : 'en contra'} de eliminar el grupo.`,
    });
    
    return proposal;
  }

  @Post(":id/transfer-admin")
  async transferAdmin(@Req() req: any, @Param("id") groupId: string, @Body() body: { newAdminId: string; newAdminWallet: string; nonce: number; signature: string }) {
    const user = await this.currentUser(req);
    const group = await this.groups.transferAdmin(groupId, user.id, user.walletAddress!, body.newAdminId, body.newAdminWallet, body.nonce, body.signature);
    
    this.notifications.emitAndSave(groupId, "system", { targetUserIds: group!.members, 
      type: "system",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'El creador anterior')} ha transferido la administracion.`,
    });
    
    return group;
  }

  @Post(":id/change-admin-leave")
  async changeAdminLeave(@Req() req: any, @Param("id") groupId: string, @Body() body: { newAdminId: string; newAdminWallet: string; nonce: number; signature: string }) {
    const user = await this.currentUser(req);
    const group = await this.groups.changeAdminAndLeave(groupId, user.id, user.walletAddress!, body.newAdminId, body.newAdminWallet, body.nonce, body.signature);
    
    this.notifications.emitAndSave(groupId, "system", { targetUserIds: group!.members, 
      type: "system",
      message: `CAMBIO EN EL GRUPO ${group!.name}: ${formatName(user, 'El creador anterior')} ha dejado el grupo y transferido la administracion.`,
    });
    
    return group;
  }

  @Patch(":id")
  async updateGroup(@Req() req: any, @Param("id") groupId: string, @Body() body: { name: string }) {
    const user = await this.currentUser(req);
    return this.groups.updateName(groupId, user.id, body.name);
  }
}






