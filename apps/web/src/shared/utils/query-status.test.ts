import { describe, expect, it } from 'vitest';
import { isQueryAwaitingData } from '@/shared/utils/query-status';

describe('isQueryAwaitingData', () => {
  it('is true on initial load', () => {
    expect(
      isQueryAwaitingData({
        isLoading: true,
        isFetching: true,
        isPlaceholderData: false,
      }),
    ).toBe(true);
  });

  it('is true while showing placeholder for a new query', () => {
    expect(
      isQueryAwaitingData({
        isLoading: false,
        isFetching: true,
        isPlaceholderData: true,
      }),
    ).toBe(true);
  });

  it('is false for settled success data', () => {
    expect(
      isQueryAwaitingData({
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
      }),
    ).toBe(false);
  });

  it('is false for background refetch of the same query', () => {
    expect(
      isQueryAwaitingData({
        isLoading: false,
        isFetching: true,
        isPlaceholderData: false,
      }),
    ).toBe(false);
  });
});
