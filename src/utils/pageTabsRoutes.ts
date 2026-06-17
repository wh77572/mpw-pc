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

export function matchRoute(
  pathname: string,
  routeList: FlatRoute[],
): FlatRoute | undefined {
  const exact = routeList.find((route) => route.path === pathname);
  if (exact) return exact;

  const sorted = [...routeList].sort(
    (a, b) => b.path.length - a.path.length,
  );
  return sorted.find(
    (route) =>
      route.path !== '/' &&
      (pathname === route.path || pathname.startsWith(`${route.path}/`)),
  );
}

export function getLocationKey(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`;
}

export const flatRoutes = flattenRoutes(routes as RouteConfig[]);

export function getRouteTitle(pathname: string): string | undefined {
  return matchRoute(pathname, flatRoutes)?.name;
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
  const route = matchRoute(pathname, flatRoutes);
  const routeName = route?.name ?? getRouteTitle(pathname);

  if (routeName && CJK_REGEX.test(routeName)) {
    return routeName;
  }

  const pathKey = pathnameToMenuKey(pathname);
  const pathLabel = getMenuLabel(pathKey);
  if (pathLabel) {
    return pathLabel;
  }

  if (routeName) {
    const nameLabel = getMenuLabel(`menu.${routeName}`);
    if (nameLabel) {
      return nameLabel;
    }
  }

  return routeName || pathname;
}
