import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '../queryClient';

describe('withTimeout', () => {
  it('resolves when fetcher resolves before timeout', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const result = await withTimeout(fetcher, 1000);
    expect(result).toBe('ok');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('rejects with TimeoutError when fetcher exceeds timeout', async () => {
    const fetcher = () => new Promise((resolve) => setTimeout(() => resolve('late'), 500));
    await expect(withTimeout(fetcher, 50)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('propagates fetcher rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withTimeout(fetcher, 1000)).rejects.toThrow('boom');
  });
});
