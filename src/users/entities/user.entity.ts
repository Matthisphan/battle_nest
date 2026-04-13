import { Column, Entity } from 'typeorm';

import { UserRole } from '../../auth/enums/user-role.enum';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', unique: true, length: 50 })
  username!: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  favoriteGame!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpires!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires!: Date | null;
}
