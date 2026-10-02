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
    } else {
      // Si el usuario ya existia pero no tenia nombre, email o wallet, lo actualizamos.
      let updated = false;
      if (name && !user.name) { user.name = name; updated = true; }
      if (email && !user.email) { user.email = email; updated = true; }
      if (walletAddress && !user.walletAddress) { user.walletAddress = walletAddress; updated = true; }
      if (updated) {
        await this.repo.save(user);
      }
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

  async updateName(id: string, name: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (user) {
      user.name = name;
      return this.repo.save(user);
    }
    return null;
  }
}
