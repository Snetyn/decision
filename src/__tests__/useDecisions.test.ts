import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDecisions } from '../hooks/useDecisions';

describe('useDecisions', () => {
  it('adds good and bad decisions', () => {
    const { result } = renderHook(() => useDecisions({ capacity: 10 }));
    act(() => { result.current.addGood(); });
    act(() => { result.current.addBad(); });
    expect(result.current.goodCount).toBe(1);
    expect(result.current.badCount).toBe(1);
    expect(result.current.totalCount).toBe(2);
  });
});
