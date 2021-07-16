<template>
  <div class="app">
    <div class="head">
      <h2 @click="clickTitle">杂乱无章</h2>
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
              :type="item.action === 'liked' ? 'ios-thumbs-up' : 'ios-thumbs-up-outline'"
              @click="like(index)"
            />
            {{item.like}}
          </li>
          <li>
            <Icon
              :type="item.action === 'disliked' ? 'ios-thumbs-down' : 'ios-thumbs-down-outline'"
              @click="dislike(index)"
            />
            {{item.dislike}}
          </li>
        </template>
      </ListItem>
    </List>
    <div>
      <Page :total="page.total" @on-change='changePage' :current="page.current"  show-elevator />
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
      page:{
        'current': 1,
        'total': 0,
      },
      pagedData:[], // 分页后的总数据
      listData:[], // 每页的数据
      sourcePagedData:[], // 每页的原始数据
      clickTag: 0,
      timeout: null,
    };
  },
  async asyncData({ $http }) {
    const data = await $http.$get(baseUrl + "/getData");
    data.forEach((item) => {
      item["action"] = null;
    });
    return{
      sourceData: JSON.parse(JSON.stringify(data))
    }
  },
  methods: {
    like(index) {
      this.listData[index].like = this.sourcePagedData[index].like + 1;
      this.listData[index].dislike = this.sourcePagedData[index].dislike;
      this.listData[index].action = "liked";
    },
    dislike(index) {
      this.listData[index].like = this.sourcePagedData[index].like;
      this.listData[index].dislike = this.sourcePagedData[index].dislike + 1;
      this.listData[index].action = "disliked";
    },
    async addData() {
      if(!this.newContext){
        this.$Message.warning({
          content: "不能为空！"
        })
        return;
      }
      await this.$http.$post(baseUrl + "/addData", {
        data: this.newContext,
      });
      const newData = await this.$http.$get(baseUrl + "/getData");
      newData.forEach((item) => {
        item["action"] = null;
      });
      this.pagedData = [];
      this.getPage(newData);
      this.newContext = '';
      this.$Message.success({
          content: "发表成功！"
        })
    },
    getPage(data){ // 按年分页
      if(!data.length) return;
      let dateYear = [];
      this.page.current = 1;
      data.forEach(item=>{
       if(!dateYear.includes(item.date.split('-')[0])) dateYear.push(item.date.split('-')[0])
      })
      dateYear.forEach((i,iIndex)=>{
        let temArr = [];
        data.forEach((j, jIndex)=>{
          if(j.date.split('-')[0] === i){
            temArr.push(j);
          }
        })
        this.pagedData.push(temArr);
      })
      this.page.total = this.pagedData.length * 10;
      this.listData = this.pagedData[0];
      this.sourcePagedData = JSON.parse(JSON.stringify(this.pagedData[0]))
    },
    changePage(currentPage){
      this.page.current = currentPage;
      this.listData = this.pagedData[currentPage -1];
      this.sourcePagedData = JSON.parse(JSON.stringify(this.pagedData[currentPage -1]))
    },
    keyDownEvent(e){
      if (e.ctrlKey && e.keyCode === 65) {
        this.showAdd = true;
      }
    },
    clickTitle(e){
      this.timeout = setTimeout(()=>{
        if(this.timeout){
          this.clickTag++;
        } else {
          this.clickTag = 0;
        }
      }, 0)
      setTimeout(()=>{
        clearTimeout(this.timeout);
        this.clickTag = 0;
      }, 2000)
      if(this.clickTag === 5){
        this.showAdd = true;
      }
    }
  },
  mounted() {
    this.getPage(this.sourceData);
    document.addEventListener("keydown", this.keyDownEvent);
  },
  beforeDestroy () {
    document.removeEventListener("keydown", this.keyDownEvent)
  }
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
.ivu-list-item.ivu-list-item-no-flex{
  margin-bottom: 10px;
}


.app .ivu-page{
  float: right;
}
</style>
