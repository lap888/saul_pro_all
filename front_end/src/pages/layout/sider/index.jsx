import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/index';
import { observer } from 'mobx-react-lite';
import { Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { PicRightOutlined } from '@ant-design/icons';
import { title, lTitle } from '../../../utils/constants'
import styles from './index.module.scss';

function SiderMenu({ collapsed, setVisible }) {
  const { configStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate(); // 路由跳转
  const location = useLocation();
  const [menuList] = useState([
    // 菜单列表
    {
      key: 'system',
      icon: <PicRightOutlined />,
      label: t('aside.system.nav'),
      children: [
        {
          key: 'settingKey',
          label: t('aside.system.setting_key'),
          onClick: () => { navigate('/settingKey'); }
        },
        {
          key: 'settingCoin',
          label: t('aside.system.setting_coin'),
          onClick: () => { navigate('/settingCoin'); }
        },
        {
          key: 'showLogs',
          label: t('aside.system.show_logs'),
          onClick: () => { navigate('/showLogs'); }
        },
        
      ],
    },
    // {
    //   key: 'orders',
    //   icon: <TableOutlined />,
    //   label: t('aside.orders.nav'),
    //   children: [
    //     {
    //       key: 'orderList',
    //       label: t('aside.orders.order_list'),
    //       onClick: () => { navigate('/orderList'); }
    //     }
    //   ],
    // }
  ]);

  // 解决刷新页面面包屑导航消失的问题
  useEffect(() => {
    let activeNode = JSON.parse(localStorage.getItem('activeItem'));
    let parentNode = JSON.parse(localStorage.getItem('parentItem'));
    if (parentNode) parentNode = menuList.find((item) => item.key === parentNode.key);
    menuList.forEach((ele) => {
      let result = ele.children.find((item) => item.path === location.pathname);
      if (result) {
        activeNode = result;
      }
    });
    if (activeNode?.label !== undefined && activeNode?.label !== null && location.pathname !== '/') {
      configStore.switchMenuItem(activeNode);
      configStore.operateCrumbMenu(parentNode);
    }
  }, [configStore, location.pathname, menuList]);

  // 返回首页
  const backHome = () => {
    configStore.crumbItem();
    navigate('/', { replace: true });
  };

  // 点击菜单
  const handleClickItem = (item) => {
    let parentNode = item.keyPath[1];
    let result = menuList.find((ele) => ele.key === parentNode);
    let activeNode = result.children.find((ele) => ele.key === item.key);
    configStore.operateCrumbMenu(result);
    configStore.switchMenuItem(activeNode);
    if (setVisible !== undefined) setVisible(false); // 收起drawer菜单
  };

  return (
    <>
      <div className={styles.logo} onClick={backHome}>
        {collapsed ? `${lTitle}` : title}
      </div>
      <Menu
        items={menuList}
        theme={configStore.themeStyle}
        mode="inline"
        selectedKeys={[configStore.activeItem.key]}
        onClick={handleClickItem}>
      </Menu>
    </>
  );
}

export default observer(SiderMenu);
