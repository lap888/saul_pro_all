import { lazy } from 'react';
export const orders = [
  {
    path: '/orderList', // 订单列表
    name: 'orderList',
    component: lazy(() => import('@/pages/orderManage/orderList')),
  }
];
