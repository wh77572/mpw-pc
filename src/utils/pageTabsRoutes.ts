import routes from '@root/config/routes';
import zhCNMenu from '@/locales/zh-CN/menu';

export type FlatRoute = {
  path: string;
  name: string;
};

type RouteConfig = {
  path?: string;
  name?: string;
  component?: string;
  redirect?: string;
  routes?: RouteConfig[];
};

const TAB_EXCLUDED_EXACT = new Set(['/']);
const TAB_EXCLUDED_PREFIXES = ['/user/'];
const CJK_REGEX = /[\u4e00-\u9fff]/;

export function shouldShowTab(pathname: string): boolean {
  if (TAB_EXCLUDED_EXACT.has(pathname)) return false;
  return !TAB_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function flattenRoutes(
  routeList: RouteConfig[],
  acc: FlatRoute[] = [],
): FlatRoute[] {
  for (const route of routeList) {
    if (route.redirect) {
      if (route.routes) flattenRoutes(route.routes, acc);
      continue;
    }
    if (route.path && route.name && route.component) {
      acc.push({ path: route.path, name: route.name });
    }
    if (route.routes) {
      flattenRoutes(route.routes, acc);
    }
  }
  return acc;
}

export function getLocationKey(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`;
}

export const flatRoutes = flattenRoutes(routes as RouteConfig[]);

/** 按路径长度降序，前缀匹配时优先最长路径，模块级只排序一次 */
const sortedFlatRoutes = [...flatRoutes].sort(
  (a, b) => b.path.length - a.path.length,
);

export function matchRoute(pathname: string): FlatRoute | undefined {
  const exact = flatRoutes.find((route) => route.path === pathname);
  if (exact) return exact;

  return sortedFlatRoutes.find(
    (route) =>
      route.path !== '/' &&
      (pathname === route.path || pathname.startsWith(`${route.path}/`)),
  );
}

const tabTitleCache = new Map<string, string>();

export function getRouteTitle(pathname: string): string | undefined {
  return matchRoute(pathname)?.name;
}

function pathnameToMenuKey(pathname: string) {
  const path = pathname.replace(/^\//, '').replace(/\//g, '.');
  return path ? `menu.${path}` : 'menu.home';
}

function getMenuLabel(key: string) {
  return zhCNMenu[key as keyof typeof zhCNMenu];
}

/** Tab 标题固定使用中文，与侧边/顶部菜单保持一致 */
export function resolveTabTitle(pathname: string): string {
  const cached = tabTitleCache.get(pathname);
  if (cached !== undefined) {
    return cached;
  }

  const route = matchRoute(pathname);
  const routeName = route?.name ?? getRouteTitle(pathname);

  let title: string;

  if (routeName && CJK_REGEX.test(routeName)) {
    title = routeName;
  } else {
    const pathKey = pathnameToMenuKey(pathname);
    const pathLabel = getMenuLabel(pathKey);
    if (pathLabel) {
      title = pathLabel;
    } else if (routeName) {
      const nameLabel = getMenuLabel(`menu.${routeName}`);
      title = nameLabel ?? routeName;
    } else {
      title = pathname;
    }
  }

  tabTitleCache.set(pathname, title);
  return title;
}
