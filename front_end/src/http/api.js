import { get } from '@/http/http.js';

/**
 * 获取配置文件
 * @param {*} params 
 * @returns 
 */
export const getConfig = (params) => get('api/config', params);
export const getConfigKey = (params) => get('api/configKey', params);
export const setConfigKey = (params) => get('api/setConfigKey', params);
export const coinDel = (params) => get('api/coin/del', params);
export const startOrStop = (params) => get('api/coin/startOrStop', params);
export const addOrUpdate = (params) => get('api/coin/addOrUpdate', params);
export const sellAll = (params) => get('api/coin/sellAll', params);
export const sellOne = (params) => get('api/coin/sellOne', params);
export const getPos = (params) => get('api/coin/getPos', params);
export const getOrders = (params) => get('api/coin/getOrders', params);
export const getLogs = (params) => get('api/logs', params);
export const delLogs = (params) => get('api/dlog', params);
export const getAccount = (params) => get('api/account', params);


