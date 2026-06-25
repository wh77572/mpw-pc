import { describe, expect, it } from 'vitest';
import {
  applyProColumnsState,
  applySettingColumnsFixed,
  buildSettingColumns,
  resolveColumnFixed,
} from './applyProColumnsState';

describe('resolveColumnFixed', () => {
  it('uses columnsMap fixed when explicitly unset', () => {
    expect(
      resolveColumnFixed({ name: { show: true, fixed: undefined } }, 'name', 'left'),
    ).toBeUndefined();
  });

  it('falls back to column fixed when columnsMap has no entry', () => {
    expect(resolveColumnFixed({}, 'name', 'right')).toBe('right');
  });
});

describe('applyProColumnsState', () => {
  it('clears fixed when columnsMap sets fixed to undefined', () => {
    const columns = [{ title: 'Name', dataIndex: 'name', fixed: 'left' as const }];
    const result = applyProColumnsState(columns, {
      '0': { show: true, fixed: undefined },
    });
    expect(result[0]?.fixed).toBeUndefined();
  });
});

describe('applySettingColumnsFixed', () => {
  it('reflects columnsMap fixed state for column setting UI', () => {
    const settingColumns = buildSettingColumns([
      { title: 'Name', dataIndex: 'name' },
    ]);
    const result = applySettingColumnsFixed(settingColumns, {
      '0': { show: true, fixed: 'left' },
    });
    expect(result[0]?.fixed).toBe('left');
  });
});
