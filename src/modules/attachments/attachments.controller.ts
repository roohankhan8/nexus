import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ATTACHMENTS_DIRECTORY,
  AttachmentsService,
} from './attachments.service';

mkdirSync(ATTACHMENTS_DIRECTORY, { recursive: true });

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post('tasks/:taskId/attachments')
  @Version('1')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: ATTACHMENTS_DIRECTORY,
        filename: (_request, file, callback) =>
          callback(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          ),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachments.create(user, taskId, file);
  }

  @Get('tasks/:taskId/attachments')
  @Version('1')
  list(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.attachments.list(user, taskId);
  }

  @Get('attachments/:attachmentId/download')
  @Version('1')
  async download(
    @CurrentUser() user: AuthUser,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ) {
    const attachment = await this.attachments.getDownload(user, attachmentId);
    response.download(
      join(ATTACHMENTS_DIRECTORY, attachment.storageKey),
      attachment.fileName,
    );
  }

  @Delete('attachments/:attachmentId')
  @Version('1')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachments.remove(user, attachmentId);
  }
}
