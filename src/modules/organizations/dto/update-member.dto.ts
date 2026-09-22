import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class UpdateMemberDto {
  @ApiProperty({ enum: [MembershipRole.ADMIN, MembershipRole.MEMBER] })
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
