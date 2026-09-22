import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @Version('1')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(user, dto);
  }

  @Get()
  @Version('1')
  list(@CurrentUser() user: AuthUser) {
    return this.organizations.list(user);
  }

  @Get(':organizationId')
  @Version('1')
  get(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizations.get(user, organizationId);
  }

  @Post(':organizationId/members')
  @Version('1')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizations.addMember(user, organizationId, dto);
  }

  @Patch(':organizationId/members/:memberId')
  @Version('1')
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.organizations.updateMember(user, organizationId, memberId, dto);
  }

  @Delete(':organizationId/members/:memberId')
  @Version('1')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizations.removeMember(user, organizationId, memberId);
  }
}
