import { createRouter, createWebHistory } from 'vue-router'
import HeartRateMonitor from '../components/HeartRateMonitor.vue'
import HeartRateRanking from '../components/HeartRateRanking.vue'

const routes = [
  {
    path: '/',
    redirect: '/monitor'
  },
  {
    path: '/monitor',
    name: 'HeartRateMonitor',
    component: HeartRateMonitor
  },
  {
    path: '/ranking',
    name: 'HeartRateRanking',
    component: HeartRateRanking
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: () => import('../components/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const whiteList = ['/login']
router.beforeEach(async (to, from, next) => {
  if (whiteList.includes(to.path)) {
    next()
  } else {
    const token = sessionStorage.getItem('rateToken')
    if (token && token.length) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router 