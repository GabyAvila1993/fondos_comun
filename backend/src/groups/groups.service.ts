import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Group } from "./group.entity";
import { Deposit } from "./deposit.entity";
import { RelayerService } from "../relayer/relayer.service";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private repo: Repository<Group>,
    @InjectRepository(Deposit) private depositRepo: Repository<Deposit>,
    private relayer: RelayerService,
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

    const stats = [];
    for (const d of deposits) {
      const group = await this.repo.findOne({ where: { id: d.groupId } });
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
}
