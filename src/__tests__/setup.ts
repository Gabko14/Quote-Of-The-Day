// Jest test setup

// Mock Date for deterministic tests
const RealDate = Date;

export function mockDate(isoDate: string): void {
  const mockNow = new RealDate(isoDate).getTime();

  global.Date = class extends RealDate {
    constructor(value?: string | number | Date) {
      if (value === undefined) {
        super(mockNow);
      } else {
        super(value);
      }
    }

    static now(): number {
      return mockNow;
    }
  } as typeof Date;
}

export function restoreDate(): void {
  global.Date = RealDate;
}

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  restoreDate();
});
