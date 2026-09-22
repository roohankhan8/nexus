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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('organizations/:organizationId/projects')
  @Version('1')
  create(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(user, organizationId, dto);
  }

  @Get('organizations/:organizationId/projects')
  @Version('1')
  list(
    @CurrentUser() user: AuthUser,
    @Param('organizationId') organizationId: string,
  ) {
    return this.projects.list(user, organizationId);
  }

  @Get('projects/:projectId')
  @Version('1')
  get(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projects.get(user, projectId);
  }

  @Patch('projects/:projectId')
  @Version('1')
  update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user, projectId, dto);
  }

  @Delete('projects/:projectId')
  @Version('1')
  remove(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projects.remove(user, projectId);
  }
}
