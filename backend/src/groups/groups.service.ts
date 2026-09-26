import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Group } from "./group.entity";
import { RelayerService } from "../relayer/relayer.service";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private repo: Repository<Group>,
    private relayer: RelayerService,
  ) {}

  async create(name: string, creatorUserId: string, creatorWallet: string, creditLimit: string, dailyLimit: number) {
    const contractAddress = await this.relayer.createGroup(name, creatorWallet, creditLimit, dailyLimit);
    const group = this.repo.create({ name, contractAddress, creatorUserId, creditLimit, dailyLimit });
    await this.repo.save(group);
    return group;
  }

  async findAll() {
    const groups = await this.repo.find({ order: { createdAt: "DESC" } });
    const seen = new Set<string>();

    return groups.filter((group) => {
      const key = `${group.creatorUserId}:${group.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
