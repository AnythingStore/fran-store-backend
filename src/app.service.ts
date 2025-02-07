import { Injectable } from '@nestjs/common';
import { Public } from './auth/public';

@Injectable()
export class AppService {

  getHello(): string {
    return 'Hello World! current version 1.0.1';
  }
}
