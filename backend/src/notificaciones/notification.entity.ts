import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string; // To whom the notification is addressed

  @Column()
  type: string; // e.g. "VOTE_REQUEST", "GROUP_DELETED", "VOTE_REJECTED"

  @Column()
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ nullable: true })
  groupId: string; // Associated group if any

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
