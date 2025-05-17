<template>
  <div class="login-root" :style="`background-image: url(${info.background});`">
    <!-- <div class="login-logo-box">
      <img class="login-logo" :src="info.logo" alt="logo" />
    </div> -->
    <div class="login-form-area">
      <div class="login-form-box">
        <div class="login-title">{{ info.title }}</div>
        <div class="login-input-wrap">
          <img class="input-icon" src="@/assets/account-icon.png" alt="账号" />
          <input class="login-input" type="text" v-model.trim="formData.username" placeholder="账号" />
        </div>
        <div class="login-input-wrap">
          <img class="input-icon" src="@/assets/password-icon.png" alt="密码" />
          <input class="login-input" type="password" v-model.trim="formData.password"  placeholder="密码" />
        </div>
        <div class="login-options">
          <label class="auto-login"><input v-model="formData.check" type="checkbox" /> 自动登录</label>
          <!-- <a class="login-link" href="#">忘记密码</a> -->
        </div>
        <button class="login-btn" @click="submitForm">登录</button>
        <!-- <div class="login-register">
          还没有账号？<a href="#" class="register-link">立即注册</a>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { login, system } from '@/api';
import { ElMessage } from 'element-plus';
export default {
  name: "LoginPage",
  data() {
    return {
      formData: {},
      info: {}
    }
  },
  created() {
    this.formData = JSON.parse(localStorage.getItem('account')) || {}
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code") || '';
    system({ code }).then(res => this.info = res)
  },
  methods: {
    // 登录
    submitForm() {
      if(!this.formData.username) {
        ElMessage({
          message: '请填写账号信息！',
          type: 'error',
        })
        return
      }
      if(!this.formData.password) {
        ElMessage({
          message: '请填写密码！',
          type: 'error',
        })
        return
      }
      login(this.formData).then(res => {
        if(this.formData.check) {
          localStorage.setItem('account', JSON.stringify(this.formData))
        } else {
          localStorage.removeItem('account')
        }
        sessionStorage.setItem('templateSign', res.templateSign)
        sessionStorage.setItem('rateToken', res.token)
        this.$router.push('/')
      })
    }
  }
};
</script>

<style scoped lang="scss">
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}
.login-root {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  min-height: 100vh;
  min-width: 100vw;
  overflow: hidden;
  background-repeat: no-repeat;
  background-position: center;
}
.login-logo-box {
  position: absolute;
  top: 60px;
  left: 80px;
  display: flex;
  flex-direction: row;
  align-items: center;
  z-index: 2;
}
.login-logo {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  display: block;
}
.login-logo-text {
  color: #fff;
  font-size: 34px;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  line-height: 48px;
  display: block;
}
.login-form-area {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 2;
}
.login-form-box {
  width: 420px;
  min-height: 520px;
  background: rgba(18, 35, 92, 0.85);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
  border: 2px solid #3a4a7c;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 48px 32px 48px;
  margin-right: 8vw;
  position: relative;
}
.login-title {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 40px;
  letter-spacing: 2px;
  text-align: center;
  user-select: none;
}
.login-input-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 0 12px;
  height: 48px;
}
.input-icon {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  opacity: 0.8;
}
.login-input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 16px;
  outline: none;
  letter-spacing: 1px;
}
.login-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  color: #bfcbd9;
  font-size: 14px;
}
.auto-login {
  display: flex;
  align-items: center;
  gap: 4px;
}
.login-link {
  color: #409eff;
  text-decoration: none;
}
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 18px;
  border-radius: 8px;
  margin-bottom: 24px;
  background: #246bfa;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: bold;
  letter-spacing: 2px;
  box-shadow: 0 4px 16px 0 rgba(36, 107, 250, 0.15);
  transition: background 0.2s;
}
.login-btn:hover {
  background: #1a4db3;
}
.login-register {
  color: #bfcbd9;
  font-size: 14px;
  text-align: center;
}
.register-link {
  color: #409eff;
  margin-left: 8px;
  text-decoration: none;
}
</style>
