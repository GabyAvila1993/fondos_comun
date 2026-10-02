import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("group_delete_proposals")
export class GroupDeleteProposal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  groupId: string;

  @Column()
  creatorUserId: string;

  @Column({ default: "pending" })
  status: "pending" | "approved" | "rejected";

  @Column("simple-json", { default: [] })
  votes: { userId: string; approve: boolean }[];

  @CreateDateColumn()
  createdAt: Date;
}
