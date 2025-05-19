<template>
  <ScreenAdapter>
    <div class="page">
      <!-- 团课背景图 -->
      <img :src="info.teamBackgroundImage" class="cover" />
      <div class="content">
        <!-- 顶部区域 -->
        <div class="header">
          <div class="wifi-time">
            <img src="@/assets/rankings/wuxian.png" alt="wifi" width="38px" />
            <div class="time">{{ currentTime }}</div>
          </div>
          <div class="title-box">
            <img src="@/assets/rankings/title.png" alt="title-bg" class="title-bg" />
            <div class="colorText">{{ info.teamName }}</div>
          </div>
          <img :src="info.logo" height="35px" alt="logo" style="opacity: 0;" />
        </div>
        <!-- 第一名用户 - 特殊样式（顶部展示） -->
        <div class="champion-container" v-if="rankingList[0]">
          <div style="position: relative; flex: 1;">
            <div class="bg" style="background: linear-gradient(0deg, #18084F, #343FB7);" />
            <div class="bg_content">
              <!-- 左侧轮播箭头 -->
              <img src="@/assets/rankings/left.png" @click="() => this.$router.back()" />
              <!-- 徽章 -->
              <img src="@/assets/rankings/first.png" alt="1st" class="rank1-icon" />
              <!-- 头像 -->
              <div class="avatar">
                <img :src="rankingList[0].avatar" alt="avatar" class="avatar-img" />
                <img src="@/assets/rankings/checkIcon.png" class="check-icon" />
              </div>
              <!-- 会员号 -->
              <div class="user">
                <div class="colorText">{{ rankingList[0].nickname }}</div>
                <p>
                  <span>本次消耗热量<label>{{ rankingList[0].calorie }}</label>千卡</span>
                  <span>本次已燃脂<label>{{ rankingList[0].fat_burning }}</label>克</span>
                  <span>实时心率<label>{{ rankingList[0].heart_rate }}</label>次/分</span>
                </p>
              </div>
              <!-- 右侧轮播箭头 -->
              <a style="margin-left: auto;" href="" target="_blank">
                <img src="@/assets/rankings/right.png" />
              </a>
            </div>
          </div>
          <div class="qrcode">
            <img :src="localQrUrl" alt="qrcode" width="100%" />
          </div>
        </div>
        <!-- 排名列表 -->
        <div class="list">
          <div v-for="i in 2" :key="i" :style="`width: ${rankingList.length < 6 ? '100%' : 'calc(50% - 5px)'}`">
            <div style="position: relative;margin-top: 10px;" v-for="(user, index) in rankingList.slice((i-1)*5, i*5)" :key="index" >
              <div class="bg" :style="`background: linear-gradient(0deg, ${user.gradient}, ${user.background});border-color: ${user.border};`" />
              <div class="bg_content">
                <!-- 排名标识 -->
                <div v-if="i == 1 && index < 3" class="rank-badge">
                  <img :src="require(`@/assets/rankings/${index === 0 ? 'first' : index === 1 ? 'two' : 'three'}.png`)"
                    alt="rank"
                    width="57px"
                  />
                </div>
                <div v-else class="rank-number">{{ i == 1 ? index + 1 : index + 6 }}</div>
                <!-- 头像 -->
                <div class="avatar">
                  <img :src="user.avatar" alt="avatar" class="avatar-img" />
                  <img src="@/assets/rankings/checkIcon.png" class="check-icon" />
                </div>
                <!-- 心率 -->
                <div class="user">
                  <div class="colorText">{{ user.nickname }}</div>
                  <p>心率<label>{{ user.heart_rate }}</label>次/分</p>
                </div>
                <!-- 进度条 -->
                <div class="progress-bar">
                  <div class="progress-bg" />
                  <div class="percent" :style="{width: `${user.heart_rate_percentage}%`, background: `linear-gradient(90deg, ${user.percent}, #FFFFFE)`}" />
                </div>
                <!-- 燃脂 -->
                <div class="calorie">
                  <span>燃脂</span>
                  <div>{{ user.fat_burning }}<span>g</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ScreenAdapter>
</template>

<script>
import ScreenAdapter from '../../components/ScreenAdapter';
import { getInfo } from '@/api';
export default {
  name: "HeartRateRanking",
  components: { ScreenAdapter },
  data() {
    return {
      localQrUrl: "",
      currentTime: "",
      info: {},
      rankingList: []
    };
  },
  created() {
    this.getBase();
    this.updateTime();
    setInterval(this.updateTime, 1000);
    this.initWebSocket(); // 获取上课人员心率数据
  },
  beforeUnmount() {
    this.closeWebSocket();
  },
  methods: {
    // 匹配颜色组合
    matchColor(data) {
      const colorObj = {
        '#E6562F': {percent: '#4b1210', border: '#e88e71', gradient: '#9f5131'},
        '#A32181': {percent: '#300038', border: '#e83aba', gradient: '#460950'},
        '#F1933B': {percent: '#592b00', border: '#f8af6b', gradient: '#a16024'},
        '#EFC444': {percent: '#624e00', border: '#f5d574', gradient: '#a69450'},
        '#8DD146': {percent: '#2e5900', border: '#84c63f', gradient: '#3e6f0b'},
        '#4CC132': {percent: '#134f15', border: '#59e33a', gradient: '#5c8646'}
      }
      Object.assign(data, colorObj[data.background])
    },
    // 获取团课信息
    getBase() {
      getInfo().then(res => {
        const { qrCode } = res
        // 处理二维码数据
        if (qrCode) {
          this.localQrUrl = qrCode.startsWith("data:image") ? qrCode : `data:image/png;base64,${qrCode}`
        }
        this.info = res
      })
    },
    // WebSocket连接
    initWebSocket() {
      try {
        this.ws = new WebSocket("wss://devsaas.hansifit.com/JbvZhE?");
        this.ws.onopen = () => {
          console.log("WebSocket连接已建立");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("收到WebSocket消息:", data);
          if (data.event === "pong") {
            // 处理心跳响应
            console.log("收到心跳响应");
          } else if (data.event === "heartRateMonitor") {
            // 处理心率数据
            data.data.map(v => this.matchColor(v))
            this.rankingList = data.data
          }
        };

        this.ws.onclose = () => {
          console.log("WebSocket连接已关闭");
          this.isConnected = false;
          this.stopHeartbeat();
          this.reconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket错误:", error);
          this.isConnected = false;
        };
      } catch (error) {
        console.error("WebSocket初始化错误:", error);
        this.reconnect();
      }
    },
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const heartbeat = {
            data: {},
            event: "ping",
            sign: this.info.teamSign, // 使用teamSign作为心跳包的sign参数
          };
          this.ws.send(JSON.stringify(heartbeat));
        }
      }, 1000); // 每1秒发送一次心跳
    },
    // 关闭连接
    closeWebSocket() {
      this.stopHeartbeat();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      if (this.ws) {
        this.ws.close();
      }
    },
    // 关闭心跳
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },
    // 重新连接
    reconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        this.reconnectTimer = setTimeout(() => {
          this.initWebSocket();
        }, 5000); // 5秒后重试
      } else {
        console.error("达到最大重连次数，停止重连");
      }
    },
    // 获取实时时间
    updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      this.currentTime = `${hours}:${minutes}:${seconds}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  width: 100%;
  height: 100%;
  background: rgba(18, 17, 17, 0.77);
  font-family: "PingFangSC", Arial, "Microsoft YaHei", sans-serif;
  color: #fff;
  .cover {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: -1;
    left: 0;
    top: 0;
  }
}
.content {
  padding: 40px 65px;
}
.colorText {
  background: linear-gradient(90deg, #FAFFB2 0%, #00FFDE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 3px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  .wifi-time {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 175px;
    .time {
      font-size: 30px;
      font-weight: 300;
    }
  }
  .title-box {
    position: relative;
    display: flex;
    left: -5%;
    justify-content: center;
    align-items: center;
    width: 544px;
    height: 118px;
    .title-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .colorText {
      z-index: 1;
      font-size: 48px;
    }
  }
  .logo {
    font-size: 22px;
    color: #fff;
  }
}
.avatar {
  position: relative;
  border: 1px solid #fff;
  border-radius: 100%;
  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 100%;
  }
  .check-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 40px;
    height: 40px;
  }
}
.user {
  margin-left: 20px;
  div {
    width: fit-content;
    font-size: 24px;
  }
  label {
    color: #FFCF44;
  }
}
.bg {
  border-radius: 10px;
  position: absolute;
  height: 100%;
  width: 100%;
  opacity: .7;
  border: 1px solid #88ABB8;
}
.bg_content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 44;
}
.champion-container {
  display: flex;
  margin-bottom: 10px;
  position: relative;
  .user {
    margin-left: 30px;
    div {
      font-size: 36px;
    }
    span {
      margin-right: 30px;
      font-size: 30px;
    }
    label {
      font-size: 48px;
    }
  }
  .avatar {
    width: 125px;
    height: 125px;
  }
  .bg_content {
    height: 170px;
    img {
      cursor: pointer;
    }
  }
  .qrcode {
    width: 170px;
    height: 170px;
    padding: 15px;
    border-radius: 10px;
    margin-left: 15px;
    background: #fff;
  }
  .rank1-icon {
    margin: -48px 40px 0 56px;
    height: 190px;
  }
}
.list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  .bg_content {
    padding: 0 30px;
    height: 120px;
  }
  .avatar {
    width: 100px;
    height: 100px;
    margin-left: 26px;
  }
  .check-icon {
    width: 36px;
    height: 36px;
  }
  .rank-number {
    font-size: 36px;
    width: 57px;
    text-align: center;
  }
  .user {
    width: 135px;
    p {
      font-size: 18px;
      margin-top: 10px;
    }
  }
}
.progress-bar {
  position: relative;
  font-size: 0;
  margin: 0 23px 0 10px;
  flex: 1;
  .progress-bg {
    border-radius: 100px;
    height: 34px;
    background: #1C1C1C;
    box-shadow: 0px 4px 3px 0px rgba(4,0,0,0.35) inset;
  }
  .percent {
    border-radius: 100px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
}
.calorie {
  width: 90px;
  margin-left: auto;
  span {
    font-size: 18px;
  }
  div {
    color: #FFCF44;
    font-size: 36px;
    margin-top: 5px;
  }
}
</style>
