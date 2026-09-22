import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class AddMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: [MembershipRole.ADMIN, MembershipRole.MEMBER],
    default: MembershipRole.MEMBER,
  })
  @IsEnum(MembershipRole)
  role: MembershipRole = MembershipRole.MEMBER;
}
