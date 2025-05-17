<template>
    <div class="outContainer" :style="{ height: boxHeight, width: boxWidth }">
        <div class="ScreenAdapter" :style="style">
            <slot />
        </div>
    </div>
</template>
<script>
export default {
    name: "ScreenAdapter",
    //参数注入
    props: {
        width: {
            type: String,
            default: '1920',
        },
        height: {
            type: String,
            default: '1080',
        },
        isPage: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            boxWidth: this.width + 'px',
            boxHeight: this.height + 'px',
            style: {
                width: this.width + 'px',
                height: this.height + 'px',
                transform: 'scale(1) translate(-50%, -50%)',
            },
        };
    },
    mounted() {
        this.setScale();
        window.onresize = this.Debounce(this.setScale, 200);
        // window.οnresize=this.setScale
    },
    unmounted() {
        window.removeEventListener('resize', this.Debounce(this.setScale, 200));
    },
    methods: {
        Debounce: (fn, t) => {
            const delay = t || 500;
            let timer;
            return function() {
                const args = arguments;
                if (timer) {
                    clearTimeout(timer);
                }
                const context = this;
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(context, args);
                }, delay);
            };
        },
        // 获取放大缩小比例
        getScale() {
            //容器高度
            this.boxWidth = document.body.clientWidth + 'px';
            if (this.isPage) {
                this.boxHeight = document.body.clientHeight + 'px';
            }

            let w;
            w = document.body.clientWidth / this.width;

            return w;
        },
        // 设置比例
        setScale() {
            this.style.transform = 'scale(' + this.getScale() + ') translate(0, 0)';

            //解决改变窗口大小时，意外出现滚动条问题
            this.$nextTick(() => {
                this.style.transform = 'scale(' + this.getScale() + ') translate(0, 0)';
            });
        },
    },
};
</script>
<style lang="scss" scoped>
.ScreenAdapter {
    overflow-y: scroll;
    scrollbar-width: none; /* firefox */
    -ms-overflow-style: none; /* IE 10+ */
    transform-origin: 0 0;
    position: absolute;
    left: 0;
    right: -17px;
    transition: 0.3s;
}
.ScreenAdapter::-webkit-scrollbar {
    display: none; /* Chrome Safari */
}
.outContainer::-webkit-scrollbar {
    display: none; /* Chrome Safari */
}
.outContainer {
    overflow-y: scroll;
    scrollbar-width: none; /* firefox */
    -ms-overflow-style: none; /* IE 10+ */
    position: relative;
}
</style>
