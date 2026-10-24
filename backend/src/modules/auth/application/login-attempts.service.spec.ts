import { HttpException } from '@nestjs/common';
import { LoginAttemptsService } from './login-attempts.service';

describe('LoginAttemptsService', () => {
  it('bloquea tras 8 fallos en 15 minutos y libera después', () => {
    const svc = new LoginAttemptsService();
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) svc.registerFailure('a@b.co', t0 + i);
    expect(() => svc.assertNotLocked('a@b.co', t0 + 100)).toThrow(HttpException);
    expect(() => svc.assertNotLocked('otro@b.co', t0 + 100)).not.toThrow();
    expect(() => svc.assertNotLocked('a@b.co', t0 + 16 * 60 * 1000)).not.toThrow();
  });

  it('reset limpia el contador', () => {
    const svc = new LoginAttemptsService();
    for (let i = 0; i < 8; i++) svc.registerFailure('a@b.co');
    svc.reset('a@b.co');
    expect(() => svc.assertNotLocked('a@b.co')).not.toThrow();
  });
});
