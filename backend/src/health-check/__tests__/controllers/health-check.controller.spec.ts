import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from '../../controllers/health-check.controller';
import { HealthCheckService } from '../../services/health-check.service';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [HealthCheckService],
    }).compile();

    healthCheckController = app.get<HealthCheckController>(
      HealthCheckController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(healthCheckController.getHello()).toBe('Hello World!');
    });
  });
});
