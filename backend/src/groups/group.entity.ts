import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

/**
 * Espejo local (para consultas rapidas y nombres "lindos") del grupo que
 * vive de verdad en Monad. La direccion del contrato es la fuente de
 * verdad; esta tabla es solo cache/UX (nombres, quien lo creo, etc).
 */
@Entity("groups")
export class Group {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  contractAddress: string;

  @Column()
  creatorUserId: string;

  @Column("decimal")
  creditLimit: string;

  @Column()
  dailyLimit: number;

  @Column("simple-array", { default: "" })
  members: string[];

  @CreateDateColumn()
  createdAt: Date;
}
