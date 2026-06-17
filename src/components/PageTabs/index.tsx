import { CloseOutlined } from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getLocationKey,
  resolveTabTitle,
  shouldShowTab,
} from '@/utils/pageTabsRoutes';

export type PageTab = {
  key: string;
  pathname: string;
  search: string;
  hash: string;
  title: string;
};

const HEADER_HEIGHT = 56;
const TAB_BAR_HEIGHT = 16;

const useStyles = createStyles(({ token, css }) => ({
  wrapper: css`
    padding-top: ${TAB_BAR_HEIGHT}px;
  `,
  tabBar: css`
    position: fixed;
    top: ${HEADER_HEIGHT}px;
    left: 0;
    right: 0;
    z-index: 18;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    overflow-x: auto;
    min-height: ${TAB_BAR_HEIGHT}px;
    padding: 6px 24px 0;
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
  tab: css`
    flex: 1 1 0;
    min-width: 72px;
    max-width: 220px;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
    cursor: pointer;
    transition:
      background ${token.motionDurationMid},
      color ${token.motionDurationMid},
      border-color ${token.motionDurationMid};

    &:hover {
      background: ${token.colorBgContainer};
      color: ${token.colorText};
    }
  `,
  tabActive: css`
    background: ${token.colorBgContainer};
    border-color: ${token.colorBorderSecondary};
    color: ${token.colorText};
  `,
  tabTitle: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${token.fontSizeSM}px;
    line-height: 1;
    text-align: left;
  `,
  tabClose: css`
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: ${token.borderRadiusSM}px;
    color: ${token.colorTextTertiary};
    font-size: 10px;

    &:hover {
      background: ${token.colorFillSecondary};
      color: ${token.colorText};
    }
  `,
}));

function buildTab(
  pathname: string,
  search: string,
  hash: string,
  title: string,
): PageTab {
  return {
    key: getLocationKey(pathname, search, hash),
    pathname,
    search,
    hash,
    title,
  };
}

const PageTabs: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { styles, cx } = useStyles();
  const location = useLocation();

  const [tabs, setTabs] = useState<PageTab[]>(() => {
    const { pathname, search, hash } = location;
    if (!shouldShowTab(pathname)) {
      return [];
    }
    return [buildTab(pathname, search, hash, resolveTabTitle(pathname))];
  });

  useEffect(() => {
    const { pathname, search, hash } = location;
    if (!shouldShowTab(pathname)) {
      return;
    }

    const key = getLocationKey(pathname, search, hash);
    const title = resolveTabTitle(pathname);

    setTabs((prev) => {
      const existing = prev.find((tab) => tab.key === key);
      if (existing) {
        if (existing.title === title) {
          return prev;
        }
        return prev.map((tab) =>
          tab.key === key ? { ...tab, title } : tab,
        );
      }
      return [...prev, buildTab(pathname, search, hash, title)];
    });
  }, [location]);

  const activeKey = getLocationKey(
    location.pathname,
    location.search,
    location.hash,
  );

  const displayTabs = useMemo(() => {
    if (tabs.length > 0) {
      return tabs;
    }
    if (!shouldShowTab(location.pathname)) {
      return [];
    }
    return [
      buildTab(
        location.pathname,
        location.search,
        location.hash,
        resolveTabTitle(location.pathname),
      ),
    ];
  }, [tabs, location]);

  const showTabBar =
    shouldShowTab(location.pathname) && displayTabs.length > 0;

  const handleTabClick = useCallback(
    (tab: PageTab) => {
      if (tab.key === activeKey) return;
      history.push(`${tab.pathname}${tab.search}${tab.hash}`);
    },
    [activeKey],
  );

  const handleTabClose = useCallback(
    (tab: PageTab, event: React.MouseEvent) => {
      event.stopPropagation();

      setTabs((prev) => {
        const next = prev.filter((item) => item.key !== tab.key);

        if (next.length === 0) {
          history.replace('/welcome');
          return next;
        }

        if (tab.key !== activeKey) {
          return next;
        }

        const closedIndex = prev.findIndex((item) => item.key === tab.key);
        const nextActive =
          next[closedIndex] ?? next[closedIndex - 1] ?? next[0];
        history.push(
          `${nextActive.pathname}${nextActive.search}${nextActive.hash}`,
        );
        return next;
      });
    },
    [activeKey],
  );

  if (!showTabBar) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={styles.tabBar} role="tablist">
        {displayTabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <div
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              className={cx(styles.tab, isActive && styles.tabActive)}
              onClick={() => handleTabClick(tab)}
            >
              <span className={styles.tabTitle} title={tab.title}>
                {tab.title}
              </span>
              <span
                className={styles.tabClose}
                role="button"
                aria-label="关闭"
                onClick={(event) => handleTabClose(tab, event)}
              >
                <CloseOutlined />
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.wrapper}>{children}</div>
    </>
  );
};

export default PageTabs;
