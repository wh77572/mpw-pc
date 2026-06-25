import { ProField, type ProColumns } from '@ant-design/pro-components';
import {
  parseProFilteredValue,
  parseProSortOrder,
} from '@ant-design/pro-components/es/table/utils';
import { Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SortOrder } from 'antd/es/table/interface';
import { createElement, type ReactNode } from 'react';

function pickTableColumnProps<T>(column: ProColumns<T, 'text'>) {
  const {
    hideInTable: _hideInTable,
    hideInForm: _hideInForm,
    hideInSetting: _hideInSetting,
    search: _search,
    formItemRender: _formItemRender,
    valueType: _valueType,
    valueEnum: _valueEnum,
    renderText: _renderText,
    proFieldProps: _proFieldProps,
    fieldProps: _fieldProps,
    formItemProps: _formItemProps,
    order: _order,
    colSize: _colSize,
    initialValue: _initialValue,
    children: _children,
    render: _render,
    ...tableColumn
  } = column;

  return tableColumn;
}

function renderCellValue<T>(
  column: ProColumns<T, 'text'>,
  text: unknown,
  record: T,
  index: number,
  columnEmptyText?: ReactNode,
) {
  const displayText = column.renderText
    ? column.renderText(text as never, record, index, undefined as never)
    : text;

  if (column.valueType || column.valueEnum) {
    return createElement(ProField as never, {
      mode: 'read',
      text: displayText,
      valueType: column.valueType || 'text',
      valueEnum: column.valueEnum,
      emptyText: columnEmptyText,
    });
  }

  return displayText as ReactNode;
}

type ColumnStateOptions = {
  sortState?: Record<string, SortOrder>;
  filterState?: Record<string, (string | number)[] | null>;
};

function convertColumn<T>(
  column: ProColumns<T, 'text'>,
  columnEmptyText?: ReactNode,
  columnState?: ColumnStateOptions,
): ColumnsType<T>[number] | null {
  if (column === Table.EXPAND_COLUMN || column === Table.SELECTION_COLUMN) {
    return column as ColumnsType<T>[number];
  }
  if (column.hideInTable) {
    return null;
  }

  const tableColumn = {
    ...pickTableColumnProps(column),
    sortOrder: parseProSortOrder(columnState?.sortState ?? {}, column),
    filteredValue: parseProFilteredValue(
      columnState?.filterState ?? {},
      column,
    ),
  };

  if (column.children?.length) {
    const children = proColumnsToTableColumns(
      column.children as ProColumns<T, 'text'>[],
      columnEmptyText,
      columnState,
    );
    if (children.length > 0) {
      return { ...tableColumn, children } as ColumnsType<T>[number];
    }
  }

  if (column.valueType === 'option') {
    return {
      ...tableColumn,
      render: (_, record, index) => {
        const nodes = column.render?.(
          _,
          record,
          index,
          undefined as never,
          column as never,
        );
        if (Array.isArray(nodes)) {
          return <Space size={8}>{nodes}</Space>;
        }
        return nodes ?? null;
      },
    } as ColumnsType<T>[number];
  }

  return {
    ...tableColumn,
    render: (text, record, index) => {
      const fieldDom = renderCellValue(
        column,
        text,
        record,
        index,
        columnEmptyText,
      );

      if (column.render) {
        return column.render(
          fieldDom,
          record,
          index,
          undefined as never,
          column as never,
        );
      }

      return fieldDom;
    },
  } as ColumnsType<T>[number];
}

export function proColumnsToTableColumns<T>(
  columns: ProColumns<T, 'text'>[] = [],
  columnEmptyText?: ReactNode,
  columnState?: ColumnStateOptions,
): ColumnsType<T> {
  return columns
    .map((column) => convertColumn(column, columnEmptyText, columnState))
    .filter((column): column is ColumnsType<T>[number] => column !== null);
}
