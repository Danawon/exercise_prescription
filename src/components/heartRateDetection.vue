<template>
  <div class="container">
    <div
      class="bg-box"
      :style="{
        background: 'url(' + bgUrl + ')',
        'background-size': '100% 100%',
      }"
    ></div>

    <!-- 心率检测竖屏 -->
    <div class="box">
      <!-- 左侧信息栏 -->
      <div class="left-sidebar">
        <div class="course-info">
          <!-- 团课名称 -->
          <div class="team-name">{{ teamName }}</div>
          <div class="time-display">{{ newDate }}</div>
          <div class="qr-code">
            <img :src="localQrUrl" alt="qr" />
          </div>
          <div class="intensity-levels">
            <div
              class="level"
              v-for="(level, index) in intensityLevels"
              :key="index"
            >
              <div class="level-color" :class="level.class"></div>
              <div class="level-name">{{ level.name }}</div>
            </div>
          </div>

          <div class="connection-status" :class="{ connected: isConnected }">
            {{ isConnected ? "已连接" : "未连接" }}
          </div>
        </div>
      </div>

      <!-- 右侧监控画面 -->
      <div class="monitor-grid" :class="gridClass">
        <div
          class="monitor-item"
          v-for="(item, index) in localUserList"
          :key="index"
        >
          <div
            class="monitor-content"
            :class="{
              col1: item.background === 'low',
              col2: item.background === 'm_low',
              col3: item.background === 'medium',
              col4: item.background === 'm_high',
              col5: item.background === 'm_high+',
              col6: item.background === 'high',
            }"
          >
            <!-- 用户信息和排名 -->
            <div class="user-info">
              <div class="ranking">#{{ item.ranking }}</div>
              <div class="avatar">
                <img :src="item.avatar" alt="avatar" />
              </div>
              <div class="nickname">{{ item.nickname }}</div>
            </div>

            <!-- 数据展示 -->
            <div class="data-display">
              <div class="data-item">
                <img :src="baseUrl + 'calorieIcon.png'" alt="calorie" />
                <span>{{ item.calorie }}千卡</span>
              </div>
              <div class="data-item">
                <img :src="baseUrl + 'fatBurningIcon.png'" alt="fat" />
                <span>{{ item.fat_burning }}克</span>
              </div>
              <div class="data-item">
                <img :src="baseUrl + 'timeIcon.png'" alt="time" />
                <span>{{ item.time }}</span>
              </div>
              <div class="data-item">
                <img :src="baseUrl + 'proportionIcon.png'" alt="proportion" />
                <span>{{ item.heart_rate_percentage }}%</span>
              </div>
              <div class="data-item heart-rate-item">
                <img :src="baseUrl + 'heartRateIconAdmin.png'" alt="heart" />
                <span>{{ item.heart_rate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'heartRateDetection',
  data() {
    return {
      cloAndRow: true,
      teamName: "",
      baseUrl: "http://cdn.hansifit.com/20220707/",
      apiBaseUrl: "https://devsaas.hansifit.com/api",
      newDate: "",
      localQrUrl: "",
      bgUrl: "",
      teamSign: "",
      intensityLevels: [
        { name: "低强度", class: "col1" },
        { name: "中低强度", class: "col2" },
        { name: "中强度", class: "col3" },
        { name: "中高强度", class: "col4" },
        { name: "中高+", class: "col5" },
        { name: "高强度", class: "col6" },
      ],
      ws: null,
      isConnected: false,
      heartbeatTimer: null,
      reconnectTimer: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      localUserList: [
        {
          nickname: "赵六",
          avatar: "https://randomuser.me/api/portraits/women/4.jpg",
          heart_rate: 105,
          calorie: "295.6",
          fat_burning: "42.3",
          time: "30:20",
          heart_rate_percentage: "82",
          ranking: 4,
          background: "high",
        },
        {
          nickname: "赵六",
          avatar: "https://randomuser.me/api/portraits/women/4.jpg",
          heart_rate: 105,
          calorie: "295.6",
          fat_burning: "42.3",
          time: "30:20",
          heart_rate_percentage: "82",
          ranking: 4,
          background: "high",
        },
        {
          nickname: "赵六",
          avatar: "https://randomuser.me/api/portraits/women/4.jpg",
          heart_rate: 105,
          calorie: "295.6",
          fat_burning: "42.3",
          time: "30:20",
          heart_rate_percentage: "82",
          ranking: 4,
          background: "high",
        },
      ],
    };
  },
  computed: {
    gridClass() {
      const length = this.localUserList.length;
      if (length <= 4) return "grid-4"; // 1-4人都使用4人布局
      if (length <= 9) return "grid-9";
      if (length <= 16) return "grid-16";
      return "grid-25";
    },
  },
  async mounted() {
    this.updateTime();
    setInterval(this.updateTime, 60000);
    await this.initData();
    this.initWebSocket();
  },
  beforeUnmount() {
    this.closeWebSocket();
  },
  methods: {
    // 初始化数据
    async initData() {
      try {
        // 获取心率监控信息
        const monitorInfo = await this.getHeartRateMonitorInfo();
        console.log("心率监控信息:", monitorInfo);
      } catch (error) {
        console.error("初始化数据失败:", error);
      }
    },

    // 获取心率监控信息
    async getHeartRateMonitorInfo() {
      try {
        // 从URL获取sign参数
        const urlParams = new URLSearchParams(window.location.search);
        const sign = urlParams.get("sign");

        if (!sign) {
          console.error("URL中缺少sign参数");
          return;
        }
        console.log("sign:", sign);

        const response = await axios.get(
          `${this.apiBaseUrl}/heart/getHeartRateMonitorInfo`,
          {
            params: {
              teamSign: sign,
            },
          }
        );
        if (response.data.code === 200) {
          const { teamName, qrCode, teamSign, teamBackgroundImage } =
            response.data.data;
          this.teamName = teamName;
          this.teamSign = teamSign;
          this.bgUrl = teamBackgroundImage;

          // 处理二维码数据
          if (qrCode) {
            // 确保base64数据格式正确
            if (qrCode.startsWith("data:image")) {
              this.localQrUrl = qrCode;
            } else {
              // 添加base64图片格式前缀
              this.localQrUrl = `data:image/png;base64,${qrCode}`;
            }
          }
        }
        return response.data;
      } catch (error) {
        console.error("获取心率监控信息失败:", error);
        throw error;
      }
    },

    // 获取强度信息
    updateTime() {
      const now = new Date();
      this.newDate = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    },
    initWebSocket() {
      try {
        this.ws = new WebSocket("wss://devsaas.hansifit.com/JbvZhE");

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
            this.handleHeartRateData(data.data);
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
            sign: this.teamSign, // 使用teamSign作为心跳包的sign参数
          };
          this.ws.send(JSON.stringify(heartbeat));
        }
      }, 1000); // 每1秒发送一次心跳
    },
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },
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
    handleHeartRateData(data) {
      // 更新本地用户列表
      this.localUserList = data.map((user) => ({
        ...user,
        background: this.getIntensityClass(user.heart_rate),
      }));
    },
    getIntensityClass(heartRate) {
      // 根据心率值返回对应的强度等级
      if (heartRate < 60) return "low";
      if (heartRate < 80) return "m_low";
      if (heartRate < 100) return "medium";
      if (heartRate < 120) return "m_high";
      if (heartRate < 140) return "m_high+";
      return "high";
    },
    closeWebSocket() {
      this.stopHeartbeat();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      if (this.ws) {
        this.ws.close();
      }
    },
  },
};
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
}

.container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;

  .bg-box {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    background-size: cover !important;
  }
}

.box {
  display: flex;
  width: 100%;
  height: 100%;
  color: #fff;
  position: relative;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.left-sidebar {
  width: 220px;
  min-width: 220px;
  padding: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.5);
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .course-info {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .team-name {
      font-size: 18px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
    }

    .time-display {
      font-size: 22px;
      text-align: center;
    }

    .qr-code {
      text-align: center;
      img {
        width: 160px;
        height: 160px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
    }

    .intensity-levels {
      margin-top: 10px;

      .level {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 4px;

        .level-color {
          width: 24px;
          height: 24px;
          margin-right: 8px;
          border-radius: 4px;

          &.col1 {
            background: linear-gradient(
              135deg,
              rgba(23, 200, 21, 0.8),
              rgba(23, 200, 21, 0.6)
            );
          }
          &.col2 {
            background: linear-gradient(
              135deg,
              rgba(135, 220, 41, 0.8),
              rgba(135, 220, 41, 0.6)
            );
          }
          &.col3 {
            background: linear-gradient(
              135deg,
              rgba(253, 203, 44, 0.8),
              rgba(253, 203, 44, 0.6)
            );
          }
          &.col4 {
            background: linear-gradient(
              135deg,
              rgba(253, 155, 30, 0.8),
              rgba(253, 155, 30, 0.6)
            );
          }
          &.col5 {
            background: linear-gradient(
              135deg,
              rgba(167, 20, 133, 0.8),
              rgba(167, 20, 133, 0.6)
            );
          }
          &.col6 {
            background: linear-gradient(
              135deg,
              rgba(244, 85, 29, 0.8),
              rgba(244, 85, 29, 0.6)
            );
          }
        }

        .level-name {
          font-size: 14px;
          color: #fff;
        }
      }
    }
  }
}

.monitor-grid {
  flex: 1;
  display: grid;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  width: calc(100% - 220px);

  &.grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 0.5%;
    padding: 1.5%;

    .avatar {
      width: min(100%, 80px);
      height: min(100%, 80px);
    }

    .nickname {
      font-size: clamp(12px, 1.2vw, 16px);
    }

    .data-item {
      img {
        width: 18%;
        min-width: 16px;
        max-width: 24px;
      }
      span {
        font-size: clamp(10px, 1.1vw, 14px);
      }
    }

    .heart-rate-item {
      img {
        width: 22%;
        min-width: 20px;
        max-width: 30px;
      }
      span {
        font-size: clamp(16px, 1.8vw, 24px);
      }
    }
  }

  &.grid-9 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 0.4%;
    padding: 1.2%;

    .avatar {
      width: min(100%, 50px);
      height: min(100%, 80px);
    }

    .nickname {
      font-size: clamp(10px, 1vw, 14px);
    }

    .data-item {
      img {
        width: 16%;
        min-width: 14px;
        max-width: 20px;
      }
      span {
        font-size: clamp(9px, 0.9vw, 12px);
      }
    }

    .heart-rate-item {
      img {
        width: 20%;
        min-width: 18px;
        max-width: 26px;
      }
      span {
        font-size: clamp(14px, 1.5vw, 20px);
      }
    }
  }

  &.grid-16 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 0.5%;
    padding: 1%;

    .avatar {
      width: min(100%, 35px);
      height: min(100%, 35px);
    }

    .nickname {
      font-size: clamp(9px, 0.9vw, 12px);
    }

    .data-item {
      img {
        width: 14%;
        min-width: 12px;
        max-width: 18px;
      }
      span {
        font-size: clamp(8px, 0.8vw, 11px);
      }
    }

    .heart-rate-item {
      img {
        width: 18%;
        min-width: 16px;
        max-width: 22px;
      }
      span {
        font-size: clamp(12px, 1.2vw, 18px);
      }
    }
  }

  &.grid-25 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-rows: repeat(5, minmax(0, 1fr));
    gap: 0.5%;
    padding: 0.8%;

    .avatar {
      width: min(100%, 30px);
      height: min(100%, 30px);
    }

    .nickname {
      font-size: clamp(8px, 0.8vw, 11px);
    }

    .data-item {
      img {
        width: 12%;
        min-width: 10px;
        max-width: 16px;
      }
      span {
        font-size: clamp(7px, 0.7vw, 10px);
      }
    }

    .heart-rate-item {
      img {
        width: 16%;
        min-width: 14px;
        max-width: 20px;
      }
      span {
        font-size: clamp(10px, 1vw, 16px);
      }
    }
  }
}

.monitor-content {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 1.5%;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .user-info {
    height: 28%;
    display: flex;
    align-items: center;
    padding: 2%;
    position: relative;
    min-height: 0;

    .ranking {
      position: absolute;
      top: 5%;
      right: 5%;
      background: #ff4757;
      color: white;
      padding: 1% 6%;
      border-radius: 0.8vw;
      font-size: clamp(10px, 1vw, 14px);
      font-weight: bold;
    }

    .avatar {
      aspect-ratio: 1;
      min-width: 30px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 3%;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .nickname {
      flex: 1;
      font-weight: bold;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 15%;
    }
  }

  .data-display {
    height: 72%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 2%;
    padding: 2%;
    min-height: 0;

    .data-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 4%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
      min-height: 0;

      img {
        height: auto;
        margin-right: 5%;
      }

      span {
        flex: 1;
        display: flex;
        align-items: center;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &.heart-rate-item {
        grid-column: 3;
        grid-row: 1 / 3;
        background: rgba(255, 255, 255, 0.15);
        justify-content: center;
        padding: 6%;

        span {
          font-weight: bold;
          background: linear-gradient(to right, #ff6b6b, #ff4757);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          justify-content: center;
        }
      }
    }
  }
}

// 强度颜色类
.col1 {
  background: linear-gradient(
    135deg,
    rgba(23, 200, 21, 0.8),
    rgba(23, 200, 21, 0.6)
  );
}
.col2 {
  background: linear-gradient(
    135deg,
    rgba(135, 220, 41, 0.8),
    rgba(135, 220, 41, 0.6)
  );
}
.col3 {
  background: linear-gradient(
    135deg,
    rgba(253, 203, 44, 0.8),
    rgba(253, 203, 44, 0.6)
  );
}
.col4 {
  background: linear-gradient(
    135deg,
    rgba(253, 155, 30, 0.8),
    rgba(253, 155, 30, 0.6)
  );
}
.col5 {
  background: linear-gradient(
    135deg,
    rgba(167, 20, 133, 0.8),
    rgba(167, 20, 133, 0.6)
  );
}
.col6 {
  background: linear-gradient(
    135deg,
    rgba(244, 85, 29, 0.8),
    rgba(244, 85, 29, 0.6)
  );
}

.head-nav {
  color: #fff;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
}

.btn-primary {
  width: 100%;
  background: #007bff;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background: #0056b3;
  }
}

.connection-status {
  margin-top: 20px;
  padding: 8px;
  text-align: center;
  border-radius: 4px;
  background: rgba(255, 0, 0, 0.2);
  color: #fff;

  &.connected {
    background: rgba(0, 255, 0, 0.2);
  }
}
</style>
