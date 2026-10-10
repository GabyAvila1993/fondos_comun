import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Group } from "./group.entity";
import { Deposit } from "./deposit.entity";
import { GroupDeleteProposal } from "./group-delete-proposal.entity";
import { RelayerService } from "../relayer/relayer.service";
import { NotificationsService } from "../notificaciones/notifications.service";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private repo: Repository<Group>,
    @InjectRepository(Deposit) private depositRepo: Repository<Deposit>,
    @InjectRepository(GroupDeleteProposal) private deleteProposalRepo: Repository<GroupDeleteProposal>,
    private relayer: RelayerService,
    private notifications: NotificationsService,
  ) {}

  async create(name: string, creatorUserId: string, creatorWallet: string, creditLimit: string, dailyLimit: number) {
    const contractAddress = await this.relayer.createGroup(name, creatorWallet, creditLimit, dailyLimit);
    const group = this.repo.create({ 
      name, 
      contractAddress, 
      creatorUserId, 
      creditLimit, 
      dailyLimit,
      members: [creatorUserId]
    });
    await this.repo.save(group);
    return group;
  }

  async recordDeposit(userId: string, groupId: string, amount: number) {
    const deposit = this.depositRepo.create({ userId, groupId, amount });
    await this.depositRepo.save(deposit);
    return deposit;
  }

  async getUserStats(userId: string) {
    const deposits = await this.depositRepo
      .createQueryBuilder("deposit")
      .select("deposit.groupId", "groupId")
      .addSelect("SUM(deposit.amount)", "totalAmount")
      .where("deposit.userId = :userId", { userId })
      .groupBy("deposit.groupId")
      .getRawMany();

    if (deposits.length === 0) return [];

    const groupIds = deposits.map((d: any) => d.groupId);
    const groups = await this.repo.findByIds(groupIds);
    const groupsMap = new Map(groups.map(g => [g.id, g]));

    const stats = [];
    for (const d of deposits) {
      const group = groupsMap.get(d.groupId);
      if (group) {
        stats.push({
          groupId: group.id,
          groupName: group.name,
          amountDeposited: parseFloat(d.totalAmount),
        });
      }
    }
    return stats;
  }

  async addMember(groupId: string, userId: string) {
    const group = await this.repo.findOne({ where: { id: groupId } });
    if (!group) return;
    
    let members = group.members || [];
    if (members.length === 1 && members[0] === "") members = [];
    
    let updated = false;
    // Asegurarnos de que el creador este en la lista para el conteo correcto
    if (!members.includes(group.creatorUserId)) {
      members.push(group.creatorUserId);
      updated = true;
    }
    
    if (!members.includes(userId)) {
      members.push(userId);
      updated = true;
    }
    
    if (updated) {
      group.members = members;
      await this.repo.save(group);
    }
  }

  async findAllForUser(userId: string) {
    const groups = await this.repo.find({ order: { createdAt: "DESC" } });
    const seen = new Set<string>();

    return groups.filter((group) => {
      let members = group.members || [];
      if (members.length === 1 && members[0] === "") members = [];
      const isMember = group.creatorUserId === userId || members.includes(userId);
      
      if (!isMember) return false;

      const key = `${group.creatorUserId}:${group.name}`;
      if (seen.has(key)) return false;
      seen.add(key);

      // Mutate for frontend return so length is correct even if DB hasn't been updated
      if (!members.includes(group.creatorUserId)) {
        group.members = [...members, group.creatorUserId];
      }
      return true;
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async getDepositsForGroup(groupId: string) {
    return this.depositRepo.find({ where: { groupId }, order: { createdAt: "DESC" } });
  }

  async remove(id: string, userId: string) {
    const group = await this.repo.findOne({ where: { id } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== userId) throw new Error("Solo el creador puede eliminar el grupo");
    
    let members = group.members || [];
    if (members.length === 1 && members[0] === "") members = [];
    if (!members.includes(group.creatorUserId)) {
      members = [...members, group.creatorUserId];
    }
    
    if (members.length > 1) {
      throw new Error("No puedes eliminar un grupo con otros miembros directamente. Debes proponer su eliminación.");
    }
    
    // Eliminar depósitos asociados primero
    await this.depositRepo.delete({ groupId: id });
    // Eliminar grupo
    await this.repo.delete(id);
    return { success: true };
  }

  async updateName(id: string, userId: string, name: string) {
    const group = await this.repo.findOne({ where: { id } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== userId) throw new Error("Solo el creador puede editar el grupo");
    
    group.editedName = name;
    await this.repo.save(group);
    return group;
  }

  // --- Delete Proposals ---
  async getDeleteProposalsForGroup(groupId: string) {
    return this.deleteProposalRepo.find({ where: { groupId } });
  }

  
  async clearDeleteProposal(groupId: string, userId: string) {
    const group = await this.repo.findOne({ where: { id: groupId } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== userId) throw new Error("Solo el creador puede cancelar la propuesta");
    await this.deleteProposalRepo.delete({ groupId });
  }

  async proposeDelete(groupId: string, userId: string) {
    const group = await this.repo.findOne({ where: { id: groupId } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== userId) throw new Error("Solo el creador puede eliminar el grupo");

    const existing = await this.deleteProposalRepo.findOne({ where: { groupId, status: "pending" } });
    if (existing) return existing;

    const proposal = this.deleteProposalRepo.create({
      groupId,
      creatorUserId: userId,
      status: "pending",
      votes: [],
    });
    await this.deleteProposalRepo.save(proposal);

    for (const member of group.members) {
      if (member !== userId) {
        this.notifications.emitAndSave(group.id, "vote", { message: `El administrador propuso eliminar el grupo ${group.name}. Requiere votación.`, targetUserId: member });
      }
    }

    return proposal;
  }

  async voteDelete(proposalId: string, userId: string, approve: boolean) {
    const proposal = await this.deleteProposalRepo.findOne({ where: { id: proposalId } });
    if (!proposal) throw new Error("Propuesta no encontrada");
    if (proposal.status !== "pending") throw new Error("La propuesta ya fue resuelta");

    const group = await this.repo.findOne({ where: { id: proposal.groupId } });
    if (!group) throw new Error("Grupo no encontrado");

    if (!group.members.includes(userId)) throw new Error("No eres miembro del grupo");
    if (userId === proposal.creatorUserId) throw new Error("El creador no vota");

    const existingVoteIndex = proposal.votes.findIndex(v => v.userId === userId);
    if (existingVoteIndex >= 0) {
      proposal.votes[existingVoteIndex].approve = approve;
    } else {
      proposal.votes.push({ userId, approve });
    }

    // Comprobar mayoría
    const totalVoters = group.members.length - 1; // Excluye creador
    const majority = Math.floor(totalVoters / 2) + 1;

    let votesFor = 0;
    let votesAgainst = 0;
    for (const v of proposal.votes) {
      if (v.approve) votesFor++;
      else votesAgainst++;
    }

    if (votesFor >= majority) {
      proposal.status = "approved";
      // Eliminar el grupo
      await this.depositRepo.delete({ groupId: group.id });
      await this.repo.delete(group.id);

      for (const member of group.members) {
        this.notifications.emitAndSave(group.id, "group_deleted", { message: `El grupo ${group.name} ha sido eliminado por votación mayoritaria.`, targetUserId: member });
      }
    } else if (votesAgainst >= majority) {
      proposal.status = "rejected";
      
      this.notifications.emitAndSave(group.id, "vote", { message: `Los participantes no quieren eliminar el grupo ${group.name}. Si vos te querés ir podés hacerlo transfiriendo el grupo a uno de los integrantes.`, targetUserId: proposal.creatorUserId });
    }

    await this.deleteProposalRepo.save(proposal);
    return proposal;
  }

  async transferAdmin(groupId: string, currentAdminId: string, currentAdminWallet: string, newAdminId: string, newAdminWallet: string, nonce: number, signature: string) {
    const group = await this.repo.findOne({ where: { id: groupId } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== currentAdminId) throw new Error("No eres el administrador");
    if (!group.members.includes(newAdminId)) throw new Error("El nuevo admin no es miembro");

    try {
      await this.relayer.transferAdminFor(group.contractAddress, currentAdminWallet, newAdminWallet, nonce, signature);
    } catch (error: any) {
      console.error("Error executing transferAdminFor on blockchain:", error);
      throw new BadRequestException(`Error en la blockchain: ${error.message || 'No se pudo ejecutar la transaccion'}`);
    }

    // Actualizar BD local
    group.creatorUserId = newAdminId;
    
    // Si quedan propuestas de eliminaci�n rechazadas, las borramos o ignoramos
    await this.deleteProposalRepo.delete({ groupId });
    await this.repo.save(group);

    for (const member of group.members) {
      this.notifications.emitAndSave(group.id, "vote", { message: `La administracion del grupo ha sido transferida a ${newAdminWallet.substring(0,6)}...`, targetUserId: member });
    }

    return group;
  }

  async changeAdminAndLeave(groupId: string, currentAdminId: string, currentAdminWallet: string, newAdminId: string, newAdminWallet: string, nonce: number, signature: string) {
    const group = await this.repo.findOne({ where: { id: groupId } });
    if (!group) throw new Error("Grupo no encontrado");
    if (group.creatorUserId !== currentAdminId) throw new Error("No eres el administrador");

    if (!group.members.includes(newAdminId)) throw new Error("El nuevo admin no es miembro");

    // Enviar a la blockchain
    try {
      await this.relayer.changeAdminAndLeaveFor(group.contractAddress, currentAdminWallet, newAdminWallet, nonce, signature);
    } catch (error: any) {
      console.error("Error executing changeAdminAndLeaveFor on blockchain:", error);
      throw new BadRequestException(`Error en la blockchain: ${error.message || 'No se pudo ejecutar la transacción'}`);
    }

    console.log(`[changeAdminAndLeave] Success on chain. currentAdminId: ${currentAdminId}, newAdminId: ${newAdminId}, prevCreator: ${group.creatorUserId}, prevMembers: ${JSON.stringify(group.members)}`);

    // Actualizar BD local
    group.creatorUserId = newAdminId;
    group.members = group.members.filter(m => m !== currentAdminId && m !== "");
    
    // Si quedan propuestas de eliminación rechazadas, las borramos o ignoramos
    await this.deleteProposalRepo.delete({ groupId });

    await this.repo.save(group);

    for (const member of group.members) {
      this.notifications.emitAndSave(group.id, "vote", { message: `El administrador anterior abandonó el grupo. El nuevo administrador es ${newAdminWallet.substring(0,6)}...`, targetUserId: member });
    }

    return group;
  }
}

