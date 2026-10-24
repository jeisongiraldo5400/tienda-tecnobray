import { Global, Module } from '@nestjs/common';
import { readAppConfig } from './app-config';

export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => readAppConfig() }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
