import type { ProTableProps } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/lib/table/interface';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PageInfo = {
  current: number;
  pageSize: number;
  total: number;
};

type UseTableMetaRequestOptions<T, U> = {
  request?: ProTableProps<T, U>['request'];
  params?: U;
  defaultData?: T[];
  dataSource?: T[];
  manualRequest?: boolean;
  postData?: (data: T[]) => T[];
  onLoad?: (data: T[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onRequestError?: (error: Error) => void;
  pagination?: false | { current?: number; pageSize?: number };
  defaultPageSize?: number;
  autoRequest?: boolean;
};

export function useTableMetaRequest<T, U>({
  request,
  params,
  defaultData,
  dataSource: controlledDataSource,
  manualRequest,
  postData,
  onLoad,
  onLoadingChange,
  onRequestError,
  pagination,
  defaultPageSize = 20,
  autoRequest = true,
}: UseTableMetaRequestOptions<T, U>) {
  const [dataSource, setDataSource] = useState<T[]>(defaultData ?? []);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfoState] = useState<PageInfo>({
    current:
      pagination && typeof pagination === 'object'
        ? (pagination.current ?? 1)
        : 1,
    pageSize:
      pagination && typeof pagination === 'object'
        ? (pagination.pageSize ?? defaultPageSize)
        : defaultPageSize,
    total: 0,
  });
  const [sortState, setSortState] = useState<Record<string, SortOrder>>({});
  const [filterState, setFilterState] = useState<
    Record<string, (string | number)[] | null>
  >({});

  const formSearchRef = useRef<Record<string, unknown>>({});
  const manualRequestRef = useRef(manualRequest);
  const skipInitialFetchRef = useRef(!autoRequest);
  const requestRef = useRef(request);
  const paramsRef = useRef(params);
  const sortRef = useRef(sortState);
  const filterRef = useRef(filterState);
  const pageInfoRef = useRef(pageInfo);

  requestRef.current = request;
  paramsRef.current = params;
  sortRef.current = sortState;
  filterRef.current = filterState;
  pageInfoRef.current = pageInfo;

  const setLoadingState = useCallback(
    (next: boolean) => {
      setLoading(next);
      onLoadingChange?.(next);
    },
    [onLoadingChange],
  );

  const setPageInfo = useCallback((next: Partial<PageInfo>) => {
    setPageInfoState((prev) => {
      const merged = { ...prev, ...next };
      pageInfoRef.current = merged;
      return merged;
    });
  }, []);

  const setFormSearch = useCallback((next: Record<string, unknown>) => {
    formSearchRef.current = next;
  }, []);

  const applyPostData = useCallback(
    (data: T[]) => (postData ? postData(data) : data),
    [postData],
  );

  const fetchList = useCallback(async () => {
    const currentRequest = requestRef.current;
    if (!currentRequest) {
      return;
    }
    if (manualRequestRef.current) {
      manualRequestRef.current = false;
      return;
    }

    setLoadingState(true);
    try {
      const currentPageInfo = pageInfoRef.current;
      const currentSort = sortRef.current ?? {};
      const currentFilter = filterRef.current ?? {};
      const pageParams =
        pagination === false
          ? {}
          : {
              current: currentPageInfo.current,
              pageSize: currentPageInfo.pageSize,
            };
      const actionParams = {
        ...pageParams,
        ...formSearchRef.current,
        ...paramsRef.current,
        ...(Object.keys(currentSort).length > 0
          ? { sorter: JSON.stringify(currentSort) }
          : {}),
        ...(Object.keys(currentFilter).length > 0
          ? { filter: JSON.stringify(currentFilter) }
          : {}),
      } as Parameters<NonNullable<ProTableProps<T, U>['request']>>[0];

      const response = await currentRequest(
        actionParams,
        currentSort,
        currentFilter,
      );

      if (response?.success === false) {
        return;
      }

      const nextData = applyPostData(response?.data ?? []);
      if (controlledDataSource === undefined) {
        setDataSource(nextData);
      }
      setPageInfo({
        total: response?.total ?? nextData.length,
      });
      onLoad?.(nextData);
    } catch (error) {
      if (onRequestError) {
        onRequestError(error as Error);
      } else {
        throw error;
      }
    } finally {
      setLoadingState(false);
    }
  }, [applyPostData, controlledDataSource, onLoad, onRequestError, pagination, setLoadingState, setPageInfo]);

  const reload = useCallback(
    async (resetPageIndex?: boolean) => {
      if (resetPageIndex) {
        setPageInfo({ current: 1 });
      }
      await fetchList();
    },
    [fetchList, setPageInfo],
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    fetchList();
  }, [fetchList, pageInfo.current, pageInfo.pageSize, sortState, filterState, params]);

  useEffect(() => {
    if (controlledDataSource !== undefined) {
      setDataSource(controlledDataSource);
    }
  }, [controlledDataSource]);

  return {
    dataSource: controlledDataSource ?? dataSource,
    loading,
    pageInfo,
    setPageInfo,
    sortState,
    setSortState,
    filterState,
    setFilterState,
    formSearchRef,
    setFormSearch,
    reload,
    manualRequestRef,
    fetchList,
  };
}
