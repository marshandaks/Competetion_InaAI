import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('SentryExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    // Determine HTTP status code
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Report server-side errors (>= 500) or completely unhandled system crashes to Sentry
    if (status >= 500 || !(exception instanceof HttpException)) {
      this.logger.error(`Reporting uncaught server error to Sentry: ${exception.message || exception}`);
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
