<template>
  <div class="app">
    <div class="head">
      <h2 @click="clickTitle">杂乱无章</h2>
      <Button v-if="!isLogin" type="info" @click="login">登录</Button>
      <span v-else>{{ email.split('@')[0].slice(0, 3) + '***' +email.split('@')[0].slice(-3) }}</span>
    </div>
    <List class="body" item-layout="vertical">
      <div v-if="showAdd" class="add">
        <Input
          class="input"
          v-model="newContext"
          type="textarea"
          :autosize="{maxRows: 5}"
          placeholder="Enter something..."
        />
        <Button class="btn" type="primary" shape="circle" @click="addData">添加心情</Button>
      </div>
      <ListItem v-for="(item,index) in listData" :key="item.id">
        <ListItemMeta :title="item.context" :description="item.date" />
        <template slot="action">
          <li>
            <Icon
              :type="item.action === 'like' ? 'ios-thumbs-up' : 'ios-thumbs-up-outline'"
              @click="like(index)"
            />
            {{item.like.length}}
          </li>
          <li>
            <Icon
              :type="item.action === 'dislike' ? 'ios-thumbs-down' : 'ios-thumbs-down-outline'"
              @click="dislike(index)"
            />
            {{item.dislike.length}}
          </li>
        </template>
      </ListItem>
    </List>
    <div>
      <Page :total="page.total" @on-change="changePage" :current="page.current" show-elevator />
    </div>
    <BackTop></BackTop>
  </div>
</template>

<script>
// const baseUrl = "http://mywords.eternitywith.xyz:3004";
const baseUrl = "http://localhost:3000";
export default {
  data() {
    return {
      showAdd: false,
      newContext: "",
      page: {
        current: 1,
        total: 0,
      },
      clickTag: 0,
      timeout: null,
      email: "",
      isLogin: false,
    };
  },
  async asyncData({ $http }) {
    const res = await $http.$get(baseUrl + "/getData?page=1");
    console.log(res);
    res.data.forEach((item) => {
      item["action"] = null;
    });
    return {
      listData: res.data,
      totalPage: res.totalPage
    };
  },
  methods: {
    like(index) {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
      if (this.listData[index].action === "like") {
        return;
      } else if (this.listData[index].action === "dislike") {
        this.listData[index].dislike.forEach((item, ind) => {
          if (item === this.email)
            this.listData[index].dislike.splice(ind, 1);
        });
      }
      this.listData[index].like.unshift(this.email);
      this.listData[index].action = "like";
      this.changeData(this.listData[index]);
    },
    dislike(index) {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
      if (this.listData[index].action === "dislike") {
        return;
      } else if (this.listData[index].action === "like") {
        this.listData[index].like.forEach((item, ind) => {
          if (item === this.email) (this.listData[index].like.splice(ind, 1), console.log(111));
        });
      }
      // console.log(this.listData[index]);
      this.listData[index].dislike.unshift(this.email);
      this.listData[index].action = "dislike";
      // console.log(this.listData[index]);
      this.changeData(this.listData[index]);
    },
    async changeData(data) {
      await this.$http.$post(baseUrl + "/changeData", {
        data,
      });
      // this.updateData();
    },
    async addData() {
      if (!this.newContext) {
        this.$Message.warning({
          content: "不能为空！",
        });
        return;
      }
      await this.$http.$post(baseUrl + "/addData", {
        data: this.newContext,
      });
      this.updateData();
      this.newContext = "";
      this.$Message.success({
        content: "发表成功！",
      });
    },
    async updateData() {
      const res = await this.$http.$get(baseUrl + "/getData?page=" + this.page.current);
      this.getPage()
      this.listData = res.data
    },
    async changePage(currentPage) {
      this.page.current = currentPage;
      const res = await this.$http.$get(baseUrl + "/getData?page=" + this.page.current);
      res.data.forEach((item) => {
        item["action"] = null;
      });
      this.listData = res.data;
      this.judgeLiked();
    },
    keyDownEvent(e) {
      if (e.ctrlKey && e.keyCode === 65) {
        this.showAdd = true;
      }
    },
    clickTitle(e) {
      this.timeout = setTimeout(() => {
        if (this.timeout) {
          this.clickTag++;
        } else {
          this.clickTag = 0;
        }
      }, 0);
      setTimeout(() => {
        clearTimeout(this.timeout);
        this.clickTag = 0;
      }, 2000);
      if (this.clickTag === 5) {
        this.showAdd = true;
      }
    },
    login() {
      this.$Modal.confirm({
        onOk: () => {
          this._login();
        },
        render: (h) => {
          return h("Input", {
            props: {
              value: this.email,
              autofocus: true,
              placeholder: "请输入邮箱",
            },
            on: {
              input: (val) => {
                this.email = val;
              },
            },
          });
        },
      });
    },
    _login() {
      let reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
      if (reg.test(this.email)) {
        this.isLogin = true;
        this.judgeLiked()
      } else {
        this.$Message.warning("格式错误！");
      }
    },
    _cancel() {},
    getPage(){
      this.page.total = this.totalPage * 10
    },
    judgeLiked(){
      this.listData.forEach((item) => {
          if (item.like.includes(this.email)) {
            item.action = "like";
          } else if (item.dislike.includes(this.email)) {
            item.action = "dislike";
          } else {
            item.action = null;
          }
        });
    }
  },
  mounted() {
    this.getPage()
    document.addEventListener("keydown", this.keyDownEvent);
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.keyDownEvent);
  },
};
</script>

<style>
.app {
  width: 80%;
  padding: 70px 0;
  margin: 0 auto;
}

.app .head {
  margin: 0px 0 200px -20px;
  display: flex;
  justify-content: space-between;
}

.app .body {
  position: relative;
}

.app .body .add {
  /* text-align: right; */
  position: absolute;
  top: -150px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  /* margin-bottom: 10px; */
}

.app .body .add .input {
  width: 500px;
  max-height: 100px;
  vertical-align: bottom;
}

.app .body .add .btn {
  /* float: right; */
  vertical-align: bottom;
}
.ivu-list-item.ivu-list-item-no-flex {
  margin-bottom: 10px;
}

.app .ivu-page {
  float: right;
}
</style>
