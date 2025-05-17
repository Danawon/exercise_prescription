import request from '@/utils/request';

// 用户登录
export function login(data) {
    return request({
        url: '/heart/system_login',
        method: 'POST',
        data
    });
}

// 心率监控系统
export function getInfo() {
    return request({
        url: '/heart/getHeartRateMonitorInfo',
        method: 'get',
        params: {
            teamSign: sessionStorage.getItem('templateSign')
        }
    });
}

// 获取心率强度区间
export function getStrength() {
    return request({
        url: '/getStrength',
        method: 'get'
    });
}

// 心率系统登录信息
export function system(params) {
    return request({
        url: '/heart/system_login',
        method: 'get',
        params
    });
}