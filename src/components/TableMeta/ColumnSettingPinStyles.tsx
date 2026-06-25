import { ConfigProvider } from 'antd';
import { useContext, useMemo } from 'react';

/** ColumnSetting Popover 挂载在 body，需全局样式让固定列操作图标始终可见 */
export function ColumnSettingPinStyles() {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('pro-table-column-setting');
  const css = useMemo(
    () =>
      `.${prefixCls}-overlay .${prefixCls}-list-item-option{display:block!important}`,
    [prefixCls],
  );

  return <style>{css}</style>;
}
