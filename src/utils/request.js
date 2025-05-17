import axios from 'axios';
import { baseUrl } from './env';
import { ElMessage, ElMessageBox } from 'element-plus'

const service = axios.create({
    baseURL: baseUrl,
    responseType: 'json',
    custom: {
      toast: true
    }
});

service.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('rateToken');
    if(token) {
      config.headers['Authorization'] = token
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

service.interceptors.response.use(
    (response) => {
      if (response.data.code && response.data.code != 200) {
        // 登录失效，清空缓存后，跳转登录页
        if (response.data.code == 204) {
          ElMessageBox.alert('很抱歉，登录已过期，请重新登录!', '登录已过期', {
            confirmButtonText: '确定',
            callback: () => {
              sessionStorage.clear()
              location.reload()
            }
          })
        } else if(response.data.code == 401) {
          location.reload()
        } else {
          ElMessage.error(response.data.msg)
        }
        return Promise.reject(response.data)
      }
      return response.data.data || response.data;
    },
    (error) => {
      return Promise.reject(error);
    }
);

export default service;
