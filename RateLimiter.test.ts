import { RateLimiter } from "./RateLimiter";

describe("RateLimiter with fake timers", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("allows requests within limit", () => {
    const limiter = new RateLimiter(3, 10);

    expect(limiter.allowRequest("u1")).toBe(true);
    expect(limiter.allowRequest("u1")).toBe(true);
    expect(limiter.allowRequest("u1")).toBe(true);
    expect(limiter.allowRequest("u1")).toBe(false);
  });

  test("requests reset after window passes", () => {
    const limiter = new RateLimiter(3, 10);

    limiter.allowRequest("u1");
    limiter.allowRequest("u1");
    limiter.allowRequest("u1");

    expect(limiter.allowRequest("u1")).toBe(false);

    jest.advanceTimersByTime(11_000);

    expect(limiter.allowRequest("u1")).toBe(true);
  });

  test("different users are independent", () => {
    const limiter = new RateLimiter(2, 10);

    expect(limiter.allowRequest("a")).toBe(true);
    expect(limiter.allowRequest("b")).toBe(true);

    expect(limiter.allowRequest("a")).toBe(true);
    expect(limiter.allowRequest("b")).toBe(true);

    expect(limiter.allowRequest("a")).toBe(false);
    expect(limiter.allowRequest("b")).toBe(false);
  });

  test("sliding window behavior (partial expiry)", () => {
    const limiter = new RateLimiter(3, 10);

    limiter.allowRequest("u1");
    jest.advanceTimersByTime(4000);

    limiter.allowRequest("u1");
    jest.advanceTimersByTime(4000);

    limiter.allowRequest("u1");

    expect(limiter.allowRequest("u1")).toBe(false);

    jest.advanceTimersByTime(3000);

    expect(limiter.allowRequest("u1")).toBe(true);
  });

  test("stress test many requests", () => {
    const limiter = new RateLimiter(100, 10);

    let allowed = 0;

    for (let i = 0; i < 200; i++) {
      if (limiter.allowRequest("u1")) {
        allowed++;
      }
    }

    expect(allowed).toBe(100);
  });

  test("many users independently", () => {
    const limiter = new RateLimiter(5, 10);

    const users = Array.from({ length: 20 }, (_, i) => `user${i}`);

    for (const user of users) {
      for (let i = 0; i < 5; i++) {
        limiter.allowRequest(user);
      }
    }

    jest.advanceTimersByTime(11_000);

    for (const user of users) {
      let count = 0;

      for (let i = 0; i < 10; i++) {
        if (limiter.allowRequest(user)) {
          count++;
        }
      }

      expect(count).toBe(5);
    }
  });
});
