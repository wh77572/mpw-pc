import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { ProCard, Search, useIntl } from '@ant-design/pro-components';
import { Container, TableContext } from '@ant-design/pro-components/es/table/Store/Provide';
import { TableToolbar } from '@ant-design/pro-components/es/table/TableToolbar';
import type { DensitySize } from '@ant-design/pro-components/es/table/components/ToolBar/DensityIcon';
import {
  flattenColumns,
  genColumnKey,
  getServerFilterResult,
  getServerSorterResult,
} from '@ant-design/pro-components/es/table/utils';
import { columnSort } from '@ant-design/pro-components/es/table/utils/columnSort';
import { omitUndefined } from '@ant-design/pro-components/es/utils';
import { ConfigProvider, Table } from 'antd';
import type {
  SorterResult,
  SortOrder,
  TablePaginationConfig,
} from 'antd/es/table/interface';
import { clsx } from 'clsx';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ColumnSettingPinStyles } from './ColumnSettingPinStyles';
import {
  applyProColumnsState,
  applySettingColumnsFixed,
  buildSettingColumns,
} from './applyProColumnsState';
import { proColumnsToTableColumns } from './proColumnsToTableColumns';
import type { TableMetaProps } from './types';
import { useTableMetaRequest } from './useTableMetaRequest';

function isBordered(
  borderType: 'search' | 'table',
  border?: TableMetaProps['cardBordered'],
) {
  if (border === undefined) {
    return false;
  }
  if (typeof border === 'boolean') {
    return border;
  }
  return border[borderType];
}

function parseSorter<T>(
  sorter?: SorterResult<T> | SorterResult<T>[] | null,
): Record<string, SortOrder> {
  if (!sorter) {
    return {};
  }

  const fromServer = (omitUndefined(
    getServerSorterResult(sorter),
  ) ?? {}) as Record<string, SortOrder>;

  if (Object.keys(fromServer).length > 0) {
    return fromServer;
  }

  const list = Array.isArray(sorter) ? sorter : [sorter];
  const result: Record<string, SortOrder> = {};

  for (const item of list) {
    if (!item.order) {
      continue;
    }
    const field = item.field ?? item.columnKey;
    if (field === undefined) {
      continue;
    }
    const key = Array.isArray(field) ? field.join('.') : String(field);
    result[key] = item.order;
  }

  return result;
}

function TableMetaContent<
  T extends Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>,
  ValueType = 'text',
>(props: TableMetaProps<T, U, ValueType>) {
  const {
    columns = [],
    request,
    params,
    actionRef,
    formRef,
    search,
    form,
    headerTitle,
    tooltip,
    toolBarRender,
    beforeSearchSubmit,
    dateFormatter,
    manualRequest,
    postData,
    onSubmit,
    onReset,
    onLoad,
    onLoadingChange,
    onRequestError,
    columnEmptyText,
    defaultData,
    debounceTime: _debounceTime,
    ghost,
    cardBordered,
    cardProps,
    tableClassName,
    tableStyle,
    rowKey,
    rowSelection,
    pagination: propsPagination,
    dataSource: propsDataSource,
    loading: propsLoading,
    className,
    style,
    columnsState,
    options,
    optionsRender,
    toolbar,
    size: propsSize,
    defaultSize: _defaultSize,
    onSizeChange: _onSizeChange,
    ...tableProps
  } = props;

  const counter = useContext(TableContext);
  const intl = useIntl();
  counter.propsRef.current = props;
  const internalActionRef = useRef<ActionType | undefined>(undefined);
  const defaultFormRef = useRef<ProFormInstance | undefined>(undefined);
  const resolvedFormRef = formRef ?? defaultFormRef;

  const {
    dataSource,
    loading,
    pageInfo,
    setPageInfo,
    setSortState,
    setFilterState,
    sortState,
    filterState,
    setFormSearch,
    formSearchRef,
    reload,
    manualRequestRef,
    fetchList,
  } = useTableMetaRequest<T, U>({
    request,
    params,
    defaultData,
    dataSource: propsDataSource ? [...propsDataSource] : undefined,
    manualRequest,
    postData,
    onLoad,
    onLoadingChange,
    onRequestError,
    pagination: propsPagination,
    autoRequest: search === false,
  });

  useEffect(() => {
    if (columnsState?.value !== undefined) {
      counter.setColumnsMap(columnsState.value);
    }
  }, [columnsState?.value]);

  const settingColumns = useMemo(() => {
    const base = buildSettingColumns(columns as ProColumns<T, 'text'>[]);
    const withFixed = applySettingColumnsFixed(
      base,
      counter.columnsMap ?? {},
    );
    return withFixed.sort(columnSort(counter.columnsMap ?? {}));
  }, [columns, counter.columnsMap, counter.sortKeyColumns]);

  useEffect(() => {
    if (settingColumns.length === 0) {
      return;
    }
    counter.setSortKeyColumns(
      settingColumns.map((item) => genColumnKey(item.key, item.index)),
    );
  }, [counter, settingColumns]);

  const visibleColumns = useMemo(
    () =>
      applyProColumnsState(
        columns as ProColumns<T, 'text'>[],
        counter.columnsMap ?? {},
      ),
    [columns, counter.columnsMap, counter.sortKeyColumns],
  );

  const tableColumns = useMemo(
    () =>
      proColumnsToTableColumns(
        visibleColumns as ProColumns<T, 'text'>[],
        columnEmptyText,
        { sortState, filterState },
      ),
    [columnEmptyText, filterState, sortState, visibleColumns],
  );

  const filterColumns = useMemo(
    () => flattenColumns(visibleColumns as ProColumns<T, 'text'>[]).filter(
      (column) => !!column.filters,
    ),
    [visibleColumns],
  );

  const onFormSearchSubmit = useCallback(
    (values: Record<string, unknown>) => {
      const nextValues = beforeSearchSubmit
        ? beforeSearchSubmit(values as Partial<U>)
        : values;
      setFormSearch(nextValues ?? {});
      onSubmit?.(nextValues as U);
      if (pageInfo.current === 1) {
        fetchList();
      } else {
        setPageInfo({ current: 1 });
      }
    },
    [
      beforeSearchSubmit,
      fetchList,
      onSubmit,
      pageInfo.current,
      setFormSearch,
      setPageInfo,
    ],
  );

  const handleReset = useCallback(() => {
    setFormSearch({});
    setSortState({});
    setFilterState({});
    onReset?.();
    if (pageInfo.current === 1) {
      fetchList();
    } else {
      setPageInfo({ current: 1 });
    }
  }, [
    fetchList,
    onReset,
    pageInfo.current,
    setFilterState,
    setFormSearch,
    setPageInfo,
    setSortState,
  ]);

  const action = useMemo(
    () =>
      ({
        pageInfo,
        setPageInfo,
        reload: async (resetPageIndex?: boolean) => {
          await reload(resetPageIndex);
        },
        reloadAndRest: async () => {
          setPageInfo({ current: 1 });
          await reload(true);
        },
        reset: async () => {
          resolvedFormRef?.current?.resetFields?.();
          const resetValues =
            resolvedFormRef?.current?.getFieldsFormatValue?.(true) ??
            resolvedFormRef?.current?.getFieldsValue?.(true) ??
            {};
          const nextSearch = beforeSearchSubmit
            ? beforeSearchSubmit(resetValues as Partial<U>)
            : resetValues;
          setFormSearch((nextSearch ?? {}) as Record<string, unknown>);
          setSortState({});
          setFilterState({});
          setPageInfo({ current: 1 });
          onReset?.();
          await reload(true);
        },
        nativeElement: counter.rootDomRef?.current ?? undefined,
        focus: () => {
          counter.rootDomRef?.current?.focus();
        },
        fullScreen: () => {
          const root = counter.rootDomRef?.current;
          if (!root || !document.fullscreenEnabled) {
            return;
          }
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            root.requestFullscreen();
          }
        },
      }) as unknown as ActionType,
    [
      beforeSearchSubmit,
      counter.rootDomRef,
      onReset,
      pageInfo,
      reload,
      resolvedFormRef,
      setFilterState,
      setFormSearch,
      setPageInfo,
      setSortState,
    ],
  );

  internalActionRef.current = action;
  counter.setAction(action);

  useEffect(() => {
    if (!actionRef) {
      return;
    }
    if (typeof actionRef === 'function') {
      actionRef(action);
      return;
    }
    actionRef.current = action;
  }, [action, actionRef]);

  useEffect(() => {
    if (manualRequest) {
      manualRequestRef.current = true;
    }
  }, [manualRequest, manualRequestRef]);

  const pagination = useMemo<TablePaginationConfig | false | undefined>(() => {
    if (propsPagination === false) {
      return false;
    }
    if (!request) {
      return propsPagination;
    }

    const userPagination =
      typeof propsPagination === 'object' ? propsPagination : {};

    return {
      showSizeChanger: true,
      showTotal: (total, range) =>
        `${intl.getMessage('pagination.total.range', '第')} ${range[0]}-${range[1]} ${intl.getMessage('pagination.total.total', '条/总共')} ${total} ${intl.getMessage('pagination.total.item', '条')}`,
      total: pageInfo.total,
      current: pageInfo.current,
      pageSize: pageInfo.pageSize,
      ...userPagination,
      onChange: (current, pageSize) => {
        userPagination.onChange?.(current, pageSize);
        setPageInfo({ current, pageSize });
      },
    };
  }, [intl, pageInfo, propsPagination, request, setPageInfo]);

  const isLightFilter = search !== false && search?.filterType === 'light';
  const hideToolbar =
    options === false &&
    !headerTitle &&
    !toolBarRender &&
    !toolbar &&
    !isLightFilter;

  const searchNode =
    search === false ? null : (
      <Search<T, U>
        search={search}
        type="table"
        pagination={pagination}
        beforeSearchSubmit={beforeSearchSubmit}
        action={internalActionRef}
        columns={columns}
        onFormSearchSubmit={onFormSearchSubmit}
        ghost={ghost}
        onReset={handleReset}
        onSubmit={onSubmit}
        loading={!!loading}
        manualRequest={manualRequest}
        form={form}
        formRef={resolvedFormRef}
        cardBordered={cardBordered}
        dateFormatter={dateFormatter ?? 'string'}
      />
    );

  const toolbarDom =
    hideToolbar ? null : (
      <TableToolbar
        hideToolbar={false}
        headerTitle={headerTitle}
        tooltip={tooltip}
        toolBarRender={toolBarRender}
        actionRef={internalActionRef}
        options={options}
        optionsRender={optionsRender}
        tableColumn={settingColumns}
        selectedRowKeys={[]}
        selectedRows={[]}
        toolbar={toolbar}
        isLightFilter={isLightFilter}
        searchNode={searchNode}
        setFormSearch={(value) => {
          setFormSearch(value ?? {});
        }}
        formSearch={formSearchRef.current}
      />
    );

  const resolvedCardProps = cardProps === false ? {} : (cardProps ?? {});
  const useCard = cardProps !== false && (!hideToolbar || search !== false);
  const tableSize = propsSize ?? counter.tableSize;

  const tableNode = (
    <Table<T>
      {...tableProps}
      className={tableClassName}
      style={tableStyle}
      rowKey={rowKey}
      columns={tableColumns}
      dataSource={dataSource}
      loading={propsLoading ?? loading}
      pagination={pagination}
      size={tableSize}
      rowSelection={rowSelection === false ? undefined : rowSelection}
      onChange={(nextPagination, filters, sorter, extra) => {
        tableProps.onChange?.(nextPagination, filters, sorter, extra);
        setSortState(parseSorter(sorter));
        setFilterState(
          (omitUndefined(
            getServerFilterResult(filters ?? {}, filterColumns),
          ) ?? {}) as Record<string, (string | number)[] | null>,
        );
        if (nextPagination.current && nextPagination.pageSize) {
          setPageInfo({
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
          });
        }
      }}
    />
  );

  const tableArea = (
    <>
      {toolbarDom}
      {tableNode}
    </>
  );

  const tableMetaDom = (
    <div
      ref={counter.rootDomRef}
      className={clsx('table-meta', className)}
      style={style}
      data-testid="table-meta"
    >
      <ColumnSettingPinStyles />
      {!isLightFilter && searchNode}
      {useCard ? (
        <ProCard
          {...resolvedCardProps}
          ghost={ghost}
          variant={isBordered('table', cardBordered) ? 'outlined' : 'borderless'}
          styles={{
            body: {
              padding: hideToolbar ? 0 : undefined,
              paddingBlockStart: hideToolbar ? undefined : 0,
              ...(resolvedCardProps.styles?.body ?? {}),
            },
            header: resolvedCardProps.styles?.header,
          }}
        >
          {tableArea}
        </ProCard>
      ) : (
        tableArea
      )}
    </div>
  );

  if (!options || !options.fullScreen) {
    return tableMetaDom;
  }

  return (
    <ConfigProvider
      getPopupContainer={() => counter.rootDomRef.current || document.body}
    >
      {tableMetaDom}
    </ConfigProvider>
  );
}

function normalizeDensitySize(size?: string): DensitySize | undefined {
  if (!size || size === 'medium') {
    return size === 'medium' ? 'middle' : undefined;
  }
  if (size === 'middle' || size === 'small' || size === 'large') {
    return size;
  }
  return undefined;
}

function TableMeta<
  T extends Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>,
  ValueType = 'text',
>(props: TableMetaProps<T, U, ValueType>) {
  const {
    columnsState,
    columns = [],
    onSizeChange,
    size,
    defaultSize,
  } = props;

  return (
    <Container
      initValue={{
        ...props,
        columnsState,
        columns,
        onSizeChange,
        size: normalizeDensitySize(size),
        defaultSize: normalizeDensitySize(defaultSize),
      }}
    >
      <TableMetaContent {...props} />
    </Container>
  );
}

export default TableMeta;
