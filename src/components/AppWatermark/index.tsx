import { useModel } from '@umijs/max';
import { Watermark } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const AppWatermark: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { initialState } = useModel('@@initialState');
  const userName = initialState?.currentUser?.name;
  const [now, setNow] = useState(() =>
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!userName) {
    return children;
  }

  return (
    <Watermark
      content={[userName, now]}
      font={{ color: 'rgba(0,0,0,0.15)', fontSize: 14 }}
      gap={[120, 100]}
      rotate={-22}
      zIndex={9}
    >
      {children}
    </Watermark>
  );
};

export default AppWatermark;
