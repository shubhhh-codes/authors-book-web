import { checkRateLimit, cleanupRateLimitStore } from './rateLimit';

describe('cleanupRateLimitStore', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    dateNowSpy = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    // Re-run cleanup with huge future time to clear everything
    const realNow = new Date('2050-01-01').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(realNow);
    cleanupRateLimitStore();
    jest.restoreAllMocks();
  });

  it('should remove expired entries and log it', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Set fixed initial time
    const initialTime = 1600000000000;
    dateNowSpy.mockReturnValue(initialTime);

    // Add an entry (limit 5, window 60s)
    checkRateLimit('test_expired_ip', 5, 60 * 1000);

    const res1 = checkRateLimit('test_expired_ip', 5, 60 * 1000);
    expect(res1.remaining).toBe(3);

    // Advance time past the window (61 seconds later)
    dateNowSpy.mockReturnValue(initialTime + 61 * 1000);

    // Run cleanup
    cleanupRateLimitStore();

    // Verify console.log was called
    expect(consoleSpy).toHaveBeenCalledWith('Rate limit cleanup: removed 1 expired entries');

    // Verify the entry was actually removed by checking it again
    const res2 = checkRateLimit('test_expired_ip', 5, 60 * 1000);
    expect(res2.remaining).toBe(4); // limit 5 - 1
  });

  it('should not remove active entries', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Set fixed initial time
    const initialTime = 1600000000000;
    dateNowSpy.mockReturnValue(initialTime);

    // Add an entry (limit 5, window 60s)
    checkRateLimit('test_active_ip', 5, 60 * 1000);

    // Advance time slightly, but not past window (30 seconds later)
    dateNowSpy.mockReturnValue(initialTime + 30 * 1000);

    // Run cleanup
    cleanupRateLimitStore();

    // Verify console.log was NOT called (no entries removed)
    expect(consoleSpy).not.toHaveBeenCalled();

    // Verify the entry is still active
    const res2 = checkRateLimit('test_active_ip', 5, 60 * 1000);
    expect(res2.remaining).toBe(3); // First call used 1, this call uses 1, remaining is 5 - 2 = 3
  });
});
