import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
      ? (exceptionResponse as { message: string | string[] }).message
      : status === 500 ? 'Internal server error' : 'Request failed';
    const details = Array.isArray(message) ? message : [];

    response.status(status).json({
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : exception instanceof HttpException ? exception.name : 'Error',
      message: Array.isArray(message) ? 'Validation failed' : message,
      details,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
