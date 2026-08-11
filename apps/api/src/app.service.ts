import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Lumina Market API scaffold (unused — storefront uses Platzi)';
  }
}
