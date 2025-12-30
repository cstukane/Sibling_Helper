import type { Mock } from 'vitest';

declare namespace jest {
  type Mock<T = any, Y extends any[] = any> = Mock<T, Y>;
}

declare namespace global {
  namespace jest {
    type Mock<T = any, Y extends any[] = any> = Mock<T, Y>;
  }
}
