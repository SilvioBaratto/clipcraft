import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return API information', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'ClipCraft API');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('description');
        });
    });
  });

  describe('/api/v1/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('/api/v1/content (GET)', () => {
    it('should return available endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/content')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('endpoints');
          expect(res.body.endpoints).toHaveProperty('tiktok');
          expect(res.body.endpoints).toHaveProperty('carousel');
          expect(res.body.endpoints).toHaveProperty('animation');
        });
    });
  });
});
