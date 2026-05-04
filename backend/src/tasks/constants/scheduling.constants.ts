import { CronExpression } from '@nestjs/schedule';

export const AI_BACKGROUND_EVALUATION_CRON = CronExpression.EVERY_5_SECONDS;

export const INITIAL_AI_EVALUATION_DELAY_SECONDS = 4;

export const MAX_VOLUNTARY_MESSAGES_IN_A_ROW = 3;
