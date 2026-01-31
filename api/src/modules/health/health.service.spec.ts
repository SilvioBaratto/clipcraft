import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', () => {
      const result = service.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });
  });

  describe('detailedCheck', () => {
    it('should return detailed health status', () => {
      const result = service.detailedCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('baml', 'ok');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('node');
    });
  });
});
