import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  /** Busca al usuario por su id de Privy, o lo crea si es la primera vez que entra. */
  async findOrCreate(privyUserId: string, walletAddress: string, email?: string, name?: string) {
    let user = await this.repo.findOne({ where: { privyUserId } });
    if (!user) {
      user = this.repo.create({ privyUserId, walletAddress, email, name });
      await this.repo.save(user);
    }
    return user;
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findMany(ids: string[]) {
    if (!ids || ids.length === 0) return Promise.resolve([]);
    return this.repo.createQueryBuilder("user")
      .where("user.id IN (:...ids)", { ids })
      .getMany();
  }
}
