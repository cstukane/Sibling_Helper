declare namespace jest {
  type Mock<T = unknown, Y extends readonly unknown[] = unknown[]> = jest.Mock<T, Y>;
}

declare namespace global {
  namespace jest {
    type Mock<T = unknown, Y extends readonly unknown[] = unknown[]> = jest.Mock<T, Y>;
  }
}
