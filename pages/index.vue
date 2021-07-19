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
              @click="like(index, false)"
            />
            {{item.like.length}}
          </li>
          <li>
            <Icon
              :type="item.action === 'dislike' ? 'ios-thumbs-down' : 'ios-thumbs-down-outline'"
              @click="dislike(index, false)"
            />
            {{item.dislike.length}}
          </li>
          <li>
            <Icon type="ios-chatbubbles-outline" @click="doMessage(index)" />
            {{item.message.length}}
          </li>
          <div v-if="item.openMsg" class="message">
            <ListItem v-for="(itemMsg,indexMsg) in item.message" :key="itemMsg.id">
              <ListItemMeta :title="itemMsg.user.split('@')[0].slice(0, 3) + '***' + itemMsg.user.split('@')[0].slice(-3) + '：' + itemMsg.context" :description="itemMsg.date" />
              <template slot="action">
                <li>
                  <Icon
                    :type="itemMsg.action === 'like' ? 'ios-thumbs-up' : 'ios-thumbs-up-outline'"
                    @click="like(indexMsg, true, itemMsg.id)"
                  />
                  {{itemMsg.like.length}}
                </li>
                <li>
                  <Icon
                    :type="itemMsg.action === 'dislike' ? 'ios-thumbs-down' : 'ios-thumbs-down-outline'"
                    @click="dislike(indexMsg, true, itemMsg.id)"
                  />
                  {{itemMsg.dislike.length}}
                </li>
                <!-- <li>
                  <Icon type="ios-chatbubbles-outline" @click="doMessage(indexMsg)" />
                  {{itemMsg.message.length}}
                </li>-->
              </template>
            </ListItem>
            <div class="addMsg">
              <Input
                class="input"
                v-model="newMsg"
                type="textarea"
                :autosize="{maxRows: 5}"
                placeholder="Enter something..."
              />
              <Button class="btn" type="primary" shape="circle" @click="addMsg(item.id, index)">留言</Button>
            </div>
          </div>
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
const baseUrl = "http://mywords.eternitywith.xyz:3004";
// const baseUrl = "http://localhost:3000";
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
      newMsg: "",
      openMsgId: null, // 记录被打开的留言板的id，发布留言后通过此id控制留言板是开启状态
      openMsgIndex: null, //记录被打开的留言板的index
    };
  },
  async asyncData({ $http }) {
    const res = await $http.$get(baseUrl + "/getData?page=1");
    res.data.forEach((item) => {
      item["action"] = null;
      item["openMsg"] = false;
      item.message.forEach((i) => {
        i["action"] = null;
      });
    });
    return {
      listData: res.data,
      totalPage: res.totalPage,
    };
  },
  methods: {
    like(index, isMessage, id) {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
      let data = isMessage
        ? this.listData[this.openMsgIndex].message[index]
        : this.listData[index];
      if (data.action === "like") {
        return;
      } else if (data.action === "dislike") {
        data.dislike.forEach((item, ind) => {
          if (item === this.email) data.dislike.splice(ind, 1);
        });
      }
      data.like.unshift(this.email);
      data.action = "like";
      isMessage ? this.changeMessage(data, this.openMsgId, id) : this.changeData(data);
    },
    dislike(index, isMessage, id) {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
      let data = isMessage
        ? this.listData[this.openMsgIndex].message[index]
        : this.listData[index];
      if (data.action === "dislike") {
        return;
      } else if (data.action === "like") {
        data.like.forEach((item, ind) => {
          if (item === this.email) data.like.splice(ind, 1);
        });
      }
      data.dislike.unshift(this.email);
      data.action = "dislike";
      isMessage ? this.changeMessage(data, this.openMsgId, id) : this.changeData(data);
    },
    async changeData(data) {
      await this.$http.$post(baseUrl + "/changeData", {
        data,
      });
    },
    async changeMessage(data, id, msgId) {
      await this.$http.$post(baseUrl + "/changeMsgData", {
        data,
        id,
        msgId,
      });
    },
    async addData() {
      if (!this.newContext) return;
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
      const res = await this.$http.$get(
        baseUrl + "/getData?page=" + this.page.current
      );
      this.getPage();
      this.judgeLiked(res.data);
      this.judgeOpenMsg(res.data, this.openMsgId);
      this.listData = res.data;
    },
    async changePage(currentPage) {
      this.page.current = currentPage;
      const res = await this.$http.$get(
        baseUrl + "/getData?page=" + this.page.current
      );
      res.data.forEach((item) => {
        item["action"] = null;
      });
      this.judgeLiked(res.data);
      this.judgeOpenMsg(res.data, this.openMsgId);
      this.listData = res.data;
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
        this.judgeLiked(this.listData);
      } else {
        this.$Message.warning("格式错误！");
      }
    },
    _cancel() {},
    getPage() {
      this.page.total = this.totalPage * 10;
    },
    judgeLiked(sourceData) {
      sourceData.forEach((item) => {
        if (item.like.includes(this.email)) {
          item.action = "like";
        } else if (item.dislike.includes(this.email)) {
          item.action = "dislike";
        } else {
          item.action = null;
        }
        item.message.forEach((i) => {
          if (i.like.includes(this.email)) {
            i.action = "like";
          } else if (i.dislike.includes(this.email)) {
            i.action = "dislike";
          } else {
            i.action = null;
          }
        });
      });
    },
    judgeOpenMsg(sourceData, id) {
      sourceData.forEach((item) => {
        item.openMsg = false;
        if (id && item.id == id) {
          item.openMsg = true;
        }
      });
    },
    doMessage(index) {
      this.listData[index].openMsg = !this.listData[index].openMsg;
      // if(!this.listData[index].openMsg) this.openMsgId = null;
      this.openMsgId = this.listData[index].openMsg
        ? this.listData[index].id
        : null;
      this.openMsgIndex = index;
    },
    like_msg() {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
    },
    dislike_msg() {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
    },
    async addMsg(id, index) {
      if (!this.isLogin) {
        this.$Message.warning("请先登录！");
        return;
      }
      if (!this.newMsg) return;
      await this.$http.$post(baseUrl + "/addMsg?id=" + id, {
        newMsg: this.newMsg,
        email: this.email,
      });
      this.openMsgId = id;
      this.updateData();
      this.newMsg = "";
    },
  },
  mounted() {
    this.getPage();
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
}

.ivu-list-item.ivu-list-item-no-flex {
  margin-bottom: 10px;
}

.app .ivu-page {
  float: right;
}

.message {
  /* height: 100px; */
  padding-left: 20px;
  /* background-color: rgb(202, 202, 202); */
  transform: scale(0.9, 0.9) ;
  /* position: relative; */
  /* top: -20px; */
}

.message .addMsg {
  /* width: 400px; */
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  top: 3px;
  margin-top: 20px;
}
.message .addMsg .input {
  width: 500px;
}

.message .ivu-list-item.ivu-list-item-no-flex {
  margin-bottom: 0px;
}

</style>
