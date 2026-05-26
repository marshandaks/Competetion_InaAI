import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueueService } from '../queue/queue.service';
import { CacheService } from '../cache/cache.service';
import { EventsGateway } from '../websocket/events.gateway';
import { EditFeedbackDto } from './dto/edit-feedback.dto';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
    private readonly eventsGateway: EventsGateway,
  ) {
    // Verify injection
    if (!prisma) {
      this.logger.error('PrismaService injection failed in constructor');
    }
  }

  async parseAndProcessCsv(fileBuffer: Buffer, fileName: string): Promise<{ totalImported: number }> {
    this.logger.debug(`Prisma service injected: ${this.prisma !== undefined}`);
    // Ensure prisma client is available
    if (!this.prisma) {
      this.logger.error('PrismaService not injected!');
      throw new Error('PrismaService not available');
    }
    this.logger.log(`Starting CSV import process for ${fileName}...`);
    const results: any[] = [];
    
    const stream = Readable.from(fileBuffer.toString());
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    this.logger.log(`Parsed ${results.length} rows from CSV`);
    let totalImported = 0;

    // Create an ImportBatch record first
    const batch = await this.prisma.importBatch.create({
      data: {
        fileName,
        importedCount: 0,
        status: 'Processing',
      },
    });

    for (const row of results) {
      const customerName = row.customer_name || row.product_name || row.Product_name || 'Anonymous';
      const rating = parseInt(row.rating || row.Rate || row.rate || '5', 10);
      const feedback = row.feedback || row.Review || row.review || row.Summary || row.summary || '';
      let createdAt = new Date();
      if (row.created_at) {
        const parsedDate = new Date(row.created_at);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }

      if (!feedback) continue;

      let initialSentiment = null;
      if (row.Sentiment || row.sentiment) {
        const lowerSent = String(row.Sentiment || row.sentiment).toLowerCase();
        if (lowerSent.includes('pos')) initialSentiment = 'positive';
        else if (lowerSent.includes('neg')) initialSentiment = 'negative';
        else if (lowerSent.includes('neu')) initialSentiment = 'neutral';
      }

      // 1. Create a feedback row in PostgreSQL
      const created = await this.prisma.feedback.create({
        data: {
          customerName,
          rating,
          feedback,
          createdAt,
          sentiment: initialSentiment,
          version: 1,
          importBatchId: batch.id,
        },
      });

      totalImported++;

      // 2. Queue a BullMQ job to run Gemini AI analysis in the background
      await this.queueService.addFeedbackJob(created.id, feedback, rating);
    }

    // Update the ImportBatch with final count
    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        importedCount: totalImported,
        status: 'Completed',
      },
    });

    // 3. Invalidate Redis Caches since new feedback has been added
    await this.cacheService.clearAnalyticsCache();

    // 4. Send websocket event indicating new file uploaded
    this.eventsGateway.broadcast('feedback:uploaded', {
      message: `File CSV berhasil diunggah! ${totalImported} data baru masuk antrian BullMQ.`,
    });

    return { totalImported };
  }

  async findAll(page = 1, limit = 10, search = '', sentiment = '') {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { feedback: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (sentiment) {
      where.sentiment = sentiment;
    }

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateFeedback(id: string, dto: EditFeedbackDto) {
    this.logger.log(`Updating feedback ID: ${id} with optimistic locking version: ${dto.version}`);

    // Retrieve active record
    const dbFeedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!dbFeedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    // CRITICAL: Optimistic Locking Check!
    if (dbFeedback.version !== dto.version) {
      this.logger.warn(`Optimistic lock failure for feedback ID ${id}. DB Version: ${dbFeedback.version}, DTO Version: ${dto.version}`);
      throw new ConflictException(
        'Conflict: Feedback telah diedit oleh user lain di latar belakang. Silakan muat ulang halaman (refresh) untuk mendapatkan data terbaru.',
      );
    }

    // Proceed to update and increment version
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        rating: dto.rating,
        feedback: dto.feedback,
        sentiment: dto.sentiment || dbFeedback.sentiment,
        topics: dto.topics || dbFeedback.topics,
        version: { increment: 1 },
      },
    });

    // Clear caches
    await this.cacheService.clearAnalyticsCache();

    // Broadcast WebSocket updates
    this.eventsGateway.broadcast('feedback:updated', {
      feedback: updated,
      message: `Feedback dari ${updated.customerName} telah diperbarui secara manual.`,
    });

    return updated;
  }

  async simulateFeedback() {
    const names = ['Rendi', 'Vina', 'Tono', 'Lina', 'Dendi', 'Nadia', 'Bagus', 'Merry'];
    const reviews = [
      { rating: 5, text: 'Pelayanan toko luar biasa, ramah dan dapet voucher potongan lagi!' },
      { rating: 1, text: 'Kecewa, pengirimannya super lama. Admin di chat cuma bales bot aja.' },
      { rating: 4, text: 'Aplikasi baru checkoutnya cepet, tapi tolong ditambahin metode bayar e-wallet ya.' },
      { rating: 2, text: 'Packs agak penyok dus luarnya, untung dalemnya aman. Tingkatkan kehati-hatian kurirnya.' },
      { rating: 5, text: 'Barang asli ori 100%, dapet cashback berlimpah. Recomended seller!' },
      { rating: 3, text: 'Standard aja sih kualitas bajunya sesuai harga lah.' },
    ];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomReview = reviews[Math.floor(Math.random() * reviews.length)];

    const created = await this.prisma.feedback.create({
      data: {
        customerName: randomName,
        rating: randomReview.rating,
        feedback: randomReview.text,
        createdAt: new Date(),
        version: 1,
      },
    });

    // Enqueue
    await this.queueService.addFeedbackJob(created.id, created.feedback, created.rating);

    return created;
  }

  async getImportBatches() {
    return this.prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteImportBatch(id: string) {
    this.logger.log(`Deleting ImportBatch ${id} and all related feedback...`);
    
    // Deletion will cascade to Feedback because of onDelete: Cascade
    await this.prisma.importBatch.delete({
      where: { id },
    });

    // Clear caches
    await this.cacheService.clearAnalyticsCache();
    
    // Broadcast
    this.eventsGateway.broadcast('feedback:uploaded', {
      message: 'Satu batch import berhasil dihapus.',
    });

    return { success: true };
  }
}
