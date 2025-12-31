declare namespace jest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Mock = any;
}

declare namespace global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Mock = any;
  }
}
