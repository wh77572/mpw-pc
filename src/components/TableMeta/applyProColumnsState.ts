import type { ProColumns } from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components/es/table/Store/Provide';
import { columnSort } from '@ant-design/pro-components/es/table/utils/columnSort';
import { genColumnKey } from '@ant-design/pro-components/es/table/utils';
import { Table } from 'antd';

export type SettingColumn<T> = ProColumns<T> & {
  index: number;
  key: string;
  children?: SettingColumn<T>[];
};

function resolveColumnKey<T>(
  column: ProColumns<T>,
  index: number,
  parentKey?: string | number,
) {
  return genColumnKey(
    column.key ?? column.dataIndex?.toString(),
    parentKey !== undefined ? `${parentKey}-${index}` : index,
  );
}

function normalizeColumnFixed(fixed: unknown): ColumnsState['fixed'] {
  if (fixed === 'left' || fixed === 'right') {
    return fixed;
  }
  return undefined;
}

/** 与 ProTable getColumnConfig 一致：columnsMap 有记录时以其中 fixed 为准（含 undefined） */
export function resolveColumnFixed(
  columnsMap: Record<string, ColumnsState>,
  columnKey: string,
  columnFixed?: unknown,
): ColumnsState['fixed'] {
  if (columnKey in columnsMap) {
    return columnsMap[columnKey].fixed;
  }
  return normalizeColumnFixed(columnFixed);
}

export function applySettingColumnsFixed<T>(
  columns: SettingColumn<T>[],
  columnsMap: Record<string, ColumnsState> = {},
): SettingColumn<T>[] {
  return columns.map((column) => ({
    ...column,
    fixed: resolveColumnFixed(columnsMap, column.key, column.fixed),
    children: column.children
      ? applySettingColumnsFixed(column.children, columnsMap)
      : undefined,
  }));
}

export function buildSettingColumns<T>(
  columns: ProColumns<T>[] = [],
  parentKey?: string | number,
): SettingColumn<T>[] {
  const result: SettingColumn<T>[] = [];

  columns.forEach((column, index) => {
    if (column === Table.EXPAND_COLUMN || column === Table.SELECTION_COLUMN) {
      return;
    }

    const columnKey = resolveColumnKey(column, index, parentKey);
    const item = {
      ...(column as ProColumns<T>),
      index,
      key: columnKey,
    } as SettingColumn<T>;

    if (column.children?.length) {
      item.children = buildSettingColumns(
        column.children as ProColumns<T>[],
        columnKey,
      );
    }

    result.push(item);
  });

  return result;
}

export function applyProColumnsState<T>(
  columns: ProColumns<T>[] = [],
  columnsMap: Record<string, ColumnsState> = {},
  parentKey?: string | number,
): ProColumns<T>[] {
  const mapped = columns
    .map((column, index) => {
      if (column === Table.EXPAND_COLUMN || column === Table.SELECTION_COLUMN) {
        return column as ProColumns<T>;
      }

      const columnKey = resolveColumnKey(column, index, parentKey);
      const config = columnsMap[columnKey];
      if (config?.show === false) {
        return null;
      }

      const nextColumn: ProColumns<T> & { index: number; key: string } = {
        ...column,
        index,
        key: columnKey,
        fixed: resolveColumnFixed(columnsMap, columnKey, column.fixed),
      };

      if (column.children?.length) {
        nextColumn.children = applyProColumnsState(
          column.children as ProColumns<T>[],
          columnsMap,
          columnKey,
        );
      }

      return nextColumn;
    })
    .filter((column): column is ProColumns<T> => column !== null);

  return mapped.sort(
    columnSort(columnsMap) as (a: ProColumns<T>, b: ProColumns<T>) => number,
  );
}
