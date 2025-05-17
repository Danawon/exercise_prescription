<template>
  <ScreenAdapter>
    <div class="page">
      <!-- 团课背景图 -->
      <img :src="info.teamBackgroundImage" class="bg" />
      <!-- 右侧团课信息 -->
      <div class="left">
        <img :src="info.systemTitleImage" height="54px" alt="logo" />
        <div class="time">{{ newDate }}</div>
        <div class="btn" @click="() => {this.$router.push('/ranking')}">{{ info.teamName }}</div>
        <div class="code">
          <img :src="localQrUrl" width="100%" />
          <div>扫码加入团课</div>
        </div>
        <div class="level" v-for="(item, idx) in info.intensityData" :key="idx">
          <div :style="`background: ${item.color}`" class="bg" />
          <div style="position: relative; z-index: 1;">
            <img :src="item.icon" />
            <span>{{ item.intensity }}</span>
          </div>
        </div>
        <div class="btnBox">
          <div class="btn">配置</div>
          <div class="btn" @click="grid = grid == 6 ? 2 : grid + 1">画面</div>
        </div>
      </div>
      <!-- 左侧列表 -->
      <div class="right" :style="`gap: ${style[grid-2].gap}px;`">
        <div v-for="item, key in localUserList" :key="key" :style="{
          width: `${style[grid-2].width}px`,
          height: `${style[grid-2].height}px`,
          backgroundImage: `url(${require(`@/assets/rate/${boxBgImg[item.background]}.png`)})`
        }">
          <div class="scale" :style="`transform: translate(0, 0) scale(${style[grid-2].scale});transform-origin: top left;`">
            <div class="content">
              <!-- 会员信息 -->
              <div class="time">
                <img :src="item.avatar" height="144px" width="144px" style="border-radius: 100%;" />
                <label>{{ item.nickname }}</label>
                <div>
                  <img src="@/assets/rate/icon-fire.png" height="49px" style="margin-left: 4px;" />
                  <span>{{ item.calorie }} kcal</span>
                </div>
                <div>
                  <img src="@/assets/rate/icon-time.png" height="50px" />
                  <span>{{ item.time }}</span>
                </div>
              </div>
              <!-- 心率 -->
              <div class="realTime">
                <div class="fatBurn" :style="`background-image: url(${require(`@/assets/rate/${boxBgImg[item.background]}_btn.png`)})`">
                  <img src="@/assets/rate/burning.png" height="33px" />
                  <b>{{ item.fat_burning }}g</b>
                </div>
                <div class="rate">
                  <img src="@/assets/rate/heart-circle.png" width="275px" />
                  <div>
                    <img src="@/assets/rate/icon_rate.png" height="38px" />
                    <div>{{ item.heart_rate }}</div>
                    <label>bpm</label>
                  </div>
                </div>
                <div style="text-align: center;font-size: 36px;">{{ item.heart_rate_percentage }}%</div>
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
  name: "HeartRateMonitor",
  components: { ScreenAdapter },
  data() {
    return {
      height: window.innerHeight,
      localQrUrl: '',
      newDate: '',
      info: {},
      ws: null,
      isConnected: false,
      heartbeatTimer: null,
      reconnectTimer: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      grid: 2,
      localUserList: [],
      style: [
        {width: 782, height: 491, gap: 30, scale: 1},
        {width: 518, height: 326, gap: 20, scale: 0.66},
        {width: 383.5, height: 240, gap: 20, scale: 0.489},
        {width: 310.8, height: 196, gap: 10, scale: 0.399},
        {width: 257, height: 161, gap: 10, scale: 0.329},
      ],
      listLength: 0,
      boxBgImg: {
        '#E6562F': 'high',
        '#A32181': 'm_high+',
        '#F1933B': 'm_high',
        '#EFC444': 'medium',
        '#8DD146': 'm_low',
        '#4CC132': 'low'
      }
    }
  },
  created() {
    this.getBase();
    this.updateTime();
    setInterval(this.updateTime, 60000);
    this.initWebSocket(); // 获取上课人员心率数据
  },
  watch: {
    listLength(len) {
      this.grid = len <= 4 ? 2 : len <= 9 ? 3 : len <= 16 ? 4 : len <= 25 ? 5 : 6;
    }
  },
  beforeUnmount() {
    this.closeWebSocket();
  },
  methods: {
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
          } else if (data.event === "heartRateMianMonitor") {
            // 处理心率数据
            this.listLength = data.data.length;
            this.localUserList = data.data
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
      this.newDate = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes() 
      .toString()
      .padStart(2, "0")}`;
    }
  }
};
</script>

<style scoped lang="scss">
.left {
  text-align: center;
  width: 236px;
  .level {
    height: 62px;
    line-height: 62px;
    font-size: 24px;
    margin-bottom: 10px;
    padding-left: 29px;
    text-align: left;
    position: relative;
    .bg {
      height: 100%;
      width: 100%;
      left: 0;
      border-radius: 10px;
      position: absolute;
      opacity: .7;
      z-index: 0;
    }
    img {
      margin-right: 13px;
      height: 26px;
      vertical-align: middle;
    }
  }
  .time {
    font-size: 36px;
    margin: 29px 0;
  }
  .btn {
    height: 53px;
    line-height: 53px;
    font-size: 24px;
    border-radius: 10px;
    cursor: pointer;
    background: linear-gradient(90deg, #59B2FF 0%, #344199 100%);
  }
  .code {
    padding: 10px;
    background: #fff;
    border-radius: 10px;
    font-size: 18px;
    color: #000;
    margin: 20px 0;
  }
  .btnBox {
    display: flex;
    gap: 10px;
    padding-top: 10px;
    div {
      width: 50%;
      height: 63px;
      line-height: 63px;
    }
  }
}
.page {
  width: 100%;
  height: 100%;
  padding: 30px;
  background: rgba(18, 17, 17, 0.3);
  font-family: 'SimHei', '黑体', sans-serif;
  display: flex;
  gap: 30px;
  color: #fff;
  align-items: flex-start;
  .bg {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: -1;
    left: 0;
    top: 0;
  }
}
.right {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  > div {
    position: relative;
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
  .bg {
    border-radius: 9.44px;
    z-index: 0;
    position: absolute;
    opacity: .7;
  }
  .scale {
    padding: 44px 108px 33px 76px;
    position: relative;
    width: 100%;
    height: 100%;
    width: 782px;
    height: 491px;
  }
  .content {
    display: flex;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }
}
.time {
  text-align: center;
  div {
    display: flex;
    align-items: center;
    margin-top: 44px;
  }
  label {
    display: block;
    font-size: 32.5px;
  }
  span {
    font-size: 36px;
    padding-left: 21px;
  }
}
.fatBurn {
  height: 57px;
  width: 170px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  font-size: 36px;
  line-height: 57px;
  text-align: center;
  margin: auto;
  img {
    margin-right: 20px;
  }
}
.rate {
  position: relative;
  font-size: 0;
  margin: 36px 0 12px 0;
  > div {
    position: absolute;
    width: 100%;
    top: 20%;
    text-align: center;
    font-size: 8px;
    line-height: 1;
    div {
      font-size: 90px;
      margin: 6px 0 7px 0;
    }
    label {
      font-size: 24px;
    }
  }
}
</style>
