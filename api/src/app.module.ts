import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ContentModule } from './modules/content/content.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BamlModule } from './shared/baml/baml.module';
import { PrismaModule } from './shared/prisma';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    BamlModule,
    HealthModule,
    ContentModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
