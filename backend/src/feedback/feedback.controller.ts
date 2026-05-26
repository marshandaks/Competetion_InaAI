import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import { EditFeedbackDto } from './dto/edit-feedback.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Feedback')
@UseGuards(JwtAuthGuard)
@Controller('api/feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload customer feedback dataset (CSV file)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: customer_name, rating, feedback, created_at',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File successfully imported and BullMQ processing initiated.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB Limit
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(`Received file upload: ${file.originalname}`);
    return this.feedbackService.parseAndProcessCsv(file.buffer, file.originalname);
  }

  @Get('batches')
  @ApiOperation({ summary: 'Get history of imported CSV files' })
  async getImportBatches() {
    return this.feedbackService.getImportBatches();
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: 'Delete an imported batch and all its feedback' })
  async deleteImportBatch(@Param('id') id: string) {
    return this.feedbackService.deleteImportBatch(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated & filtered analyzed feedback feed' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Active feed page (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name/feedback' })
  @ApiQuery({ name: 'sentiment', required: false, type: String, description: 'Filter by sentiment: positive, neutral, negative' })
  @ApiResponse({ status: 200, description: 'Feedback feed successfully loaded.' })
  async getFeedbacks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sentiment') sentiment?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.feedbackService.findAll(pageNum, limitNum, search, sentiment);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feedback sentiment/rating manually with optimistic lock verification' })
  @ApiResponse({ status: 200, description: 'Feedback details successfully updated.' })
  @ApiResponse({ status: 409, description: 'Locking Conflict: The feedback has been edited by another user in the background.' })
  async editFeedback(@Param('id') id: string, @Body() dto: EditFeedbackDto) {
    return this.feedbackService.updateFeedback(id, dto);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Generate a fake customer feedback review (simulation mode)' })
  @ApiResponse({ status: 201, description: 'Dummy feedback generated and pushed to analysis worker.' })
  async triggerSimulation() {
    return this.feedbackService.simulateFeedback();
  }
}
