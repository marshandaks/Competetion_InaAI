import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../prisma.service';
import { QueueService } from '../queue/queue.service';
import { CacheService } from '../cache/cache.service';
import { EventsGateway } from '../websocket/events.gateway';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prisma: any;
  let queueService: any;
  let cacheService: any;
  let eventsGateway: any;

  const mockPrisma = {
    importBatch: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    feedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueue = {
    addFeedbackJob: jest.fn(),
  };

  const mockCache = {
    clearAnalyticsCache: jest.fn(),
  };

  const mockEvents = {
    broadcast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: CacheService, useValue: mockCache },
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prisma = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
    cacheService = module.get<CacheService>(CacheService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseAndProcessCsv', () => {
    it('should successfully parse CSV and create feedback records', async () => {
      const csvContent = 'customer_name,rating,feedback,created_at\nJoko,5,Sangat bagus sekali!,2026-05-25';
      const fileBuffer = Buffer.from(csvContent);
      const fileName = 'test.csv';

      prisma.importBatch.create.mockResolvedValue({ id: 'batch-123' });
      prisma.feedback.create.mockResolvedValue({ id: 'feedback-123', customerName: 'Joko' });
      prisma.importBatch.update.mockResolvedValue({ id: 'batch-123', importedCount: 1 });

      const result = await service.parseAndProcessCsv(fileBuffer, fileName);

      expect(result).toEqual({ totalImported: 1 });
      expect(prisma.importBatch.create).toHaveBeenCalledWith({
        data: { fileName, importedCount: 0, status: 'Processing' },
      });
      expect(prisma.feedback.create).toHaveBeenCalled();
      expect(queueService.addFeedbackJob).toHaveBeenCalledWith('feedback-123', 'Sangat bagus sekali!', 5);
      expect(prisma.importBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: { importedCount: 1, status: 'Completed' },
      });
      expect(cacheService.clearAnalyticsCache).toHaveBeenCalled();
      expect(eventsGateway.broadcast).toHaveBeenCalledWith('feedback:uploaded', expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return paginated feedback list', async () => {
      const mockItems = [
        { id: '1', customerName: 'A', rating: 5, feedback: 'B', version: 1, createdAt: new Date() },
      ];
      prisma.feedback.findMany.mockResolvedValue(mockItems);
      prisma.feedback.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, 'search-term', 'positive');

      expect(result).toEqual({
        items: mockItems,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { customerName: { contains: 'search-term', mode: 'insensitive' } },
            { feedback: { contains: 'search-term', mode: 'insensitive' } },
          ],
          sentiment: 'positive',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('updateFeedback', () => {
    const feedbackId = 'feedback-1';
    const editDto = { feedback: 'Updated feedback', rating: 4, version: 1 };

    it('should update feedback if version matches (optimistic locking success)', async () => {
      const existingFeedback = { id: feedbackId, version: 1, customerName: 'John' };
      prisma.feedback.findUnique.mockResolvedValue(existingFeedback);
      prisma.feedback.update.mockResolvedValue({ ...existingFeedback, ...editDto, version: 2 });

      const result = await service.updateFeedback(feedbackId, editDto);

      expect(result.version).toBe(2);
      expect(prisma.feedback.findUnique).toHaveBeenCalledWith({ where: { id: feedbackId } });
      expect(prisma.feedback.update).toHaveBeenCalledWith({
        where: { id: feedbackId },
        data: {
          rating: 4,
          feedback: 'Updated feedback',
          sentiment: undefined,
          topics: undefined,
          version: { increment: 1 },
        },
      });
      expect(cacheService.clearAnalyticsCache).toHaveBeenCalled();
      expect(eventsGateway.broadcast).toHaveBeenCalledWith('feedback:updated', expect.any(Object));
    });

    it('should throw ConflictException if version does not match (optimistic locking failure)', async () => {
      const existingFeedback = { id: feedbackId, version: 2, customerName: 'John' }; // version mismatched (dto has 1, DB has 2)
      prisma.feedback.findUnique.mockResolvedValue(existingFeedback);

      await expect(service.updateFeedback(feedbackId, editDto)).rejects.toThrow(ConflictException);
      expect(prisma.feedback.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if feedback does not exist', async () => {
      prisma.feedback.findUnique.mockResolvedValue(null);

      await expect(service.updateFeedback(feedbackId, editDto)).rejects.toThrow(NotFoundException);
      expect(prisma.feedback.update).not.toHaveBeenCalled();
    });
  });
});
