import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '../services/health-check.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller()
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.healthCheckService.getHello();
  }
}
