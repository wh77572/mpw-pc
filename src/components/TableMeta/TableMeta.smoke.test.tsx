import { ProConfigProvider } from '@ant-design/pro-components';
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { describe, expect, it, vi } from 'vitest';
import TableMeta from './index';

vi.mock('@ant-design/pro-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ant-design/pro-components')>();
  return actual;
});

describe('TableMeta smoke', () => {
  it('renders search form and table', async () => {
    const request = vi.fn().mockResolvedValue({
      data: [{ key: 1, name: 'test', status: 1 }],
      total: 1,
      success: true,
    });

    render(
      <ConfigProvider locale={zhCN}>
        <ProConfigProvider>
          <TableMeta
            rowKey="key"
            search={{ labelWidth: 120 }}
            request={request}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              {
                title: 'Status',
                dataIndex: 'status',
                valueEnum: {
                  1: { text: 'Running', status: 'Processing' },
                },
              },
            ]}
          />
        </ProConfigProvider>
      </ConfigProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('table-meta')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
    });
  });

  it('renders column setting control by default', async () => {
    const request = vi.fn().mockResolvedValue({
      data: [{ key: 1, name: 'test', status: 1 }],
      total: 1,
      success: true,
    });

    render(
      <ConfigProvider locale={zhCN}>
        <ProConfigProvider>
          <TableMeta
            rowKey="key"
            headerTitle="Test Table"
            request={request}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              { title: 'Status', dataIndex: 'status' },
            ]}
          />
        </ProConfigProvider>
      </ConfigProvider>,
    );

    await waitFor(() => {
      expect(
        document.querySelector('.ant-pro-table-list-toolbar-setting-items'),
      ).toBeInTheDocument();
    });
  });
});
