import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.log(exception);
    let status =  exception.status || HttpStatus.INTERNAL_SERVER_ERROR ;

    let message =
      exception instanceof Error
        ? exception.message
        :  'An unexpected error occurred';
   if (exception?.response?.message) message=exception.response.message;
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
