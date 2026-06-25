import type {
  ActionType,
  ProColumns,
  ProTableProps,
  RequestData,
} from '@ant-design/pro-components';
import type { SortOrder } from 'antd/lib/table/interface';

import type { FilterValue } from 'antd/es/table/interface';

/** 与 ProTable request 第三参数兼容 */
export type TableMetaFilterValue = FilterValue | null;

export type TableMetaRequestParams<U> = U & {
  current?: number;
  pageSize?: number;
  keyword?: string;
};

/** 暂不实现的 ProTable 高级能力 */
type TableMetaOmittedKeys =
  | 'tableRender'
  | 'tableViewRender'
  | 'tableExtraRender'
  | 'searchFormRender'
  | 'editable'
  | 'polling'
  | 'name'
  | 'ErrorBoundary'
  | 'tableAlertRender'
  | 'tableAlertOptionRender'
  | 'revalidateOnFocus';

export type TableMetaProps<
  T extends Record<string, unknown> = Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>,
  ValueType = 'text',
> = Omit<ProTableProps<T, U, ValueType>, TableMetaOmittedKeys>;

export type { ActionType, ProColumns, RequestData };
