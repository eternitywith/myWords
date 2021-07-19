const router = require('koa-router')(),
  fs = require('fs'),
  path = require('path');

let targetFile = path.join(__dirname, '../data/data.json')

router.get('/getData', async (ctx, next) => {
  let data = JSON.parse(fs.readFileSync(targetFile))
  let page = ctx.request.query.page - 1;
  let dateYear = [];
  let pagedData = [];
  data.forEach((item) => {
    if (!dateYear.includes(item.date.split("-")[0]))
      dateYear.push(item.date.split("-")[0]);
  });
  dateYear.forEach((i, iIndex) => {
    let temArr = [];
    data.forEach((j, jIndex) => {
      if (j.date.split("-")[0] === i)
        temArr.push(j);
    });
    pagedData.push(temArr);
  });
  ctx.body = {
    data: pagedData[page],
    totalPage: pagedData.length
  };
});

router.post('/addData', async (ctx, next) => {
  let data = JSON.parse(fs.readFileSync(targetFile))
  let newData = {
    "id": data.length + 1,
    "context": ctx.request.body.data,
    "date": format(new Date(), 'yyyy-MM-dd-hh-mm'),
    "like": [],
    "dislike": [],
    "message": []
  }
  data.unshift(newData)
  fs.writeFileSync(targetFile, JSON.stringify(data))
  ctx.body = newData
});

router.post('/changeData', async (ctx, next) => {
  let dataAll = JSON.parse(fs.readFileSync(targetFile))
  let newData = ctx.request.body.data
  dataAll.forEach((item, index) => {
    if (item.id === newData.id) dataAll[index] = {
      ...newData
    }
  })
  fs.writeFileSync(targetFile, JSON.stringify(dataAll))
  ctx.body = newData
});

router.post('/addMsg', async (ctx, next) => {
  let data = JSON.parse(fs.readFileSync(targetFile))
  let id = ctx.request.query.id;
  let {
    email,
    newMsg
  } = ctx.request.body
  let newData = {}
  data.forEach(item => {
    if (item.id == id) {
      newData = {
        "id": item.message.length + 1,
        "user": email,
        "context": newMsg,
        "date": format(new Date(), 'yyyy-MM-dd-hh-mm'),
        "like": [],
        "dislike": []
      }
      item.message.unshift(newData)
    }
  })
  fs.writeFileSync(targetFile, JSON.stringify(data))
  ctx.body = newData
});

router.post('/changeMsgData', async (ctx, next) => {
  let dataAll = JSON.parse(fs.readFileSync(targetFile))
  let {
    data,
    id,
    msgId
  } = ctx.request.body
  dataAll.forEach((item, index) => {
    if (item.id == id) {
      item.message.forEach((i, ind) => {
        if (i.id == msgId) dataAll[index].message[ind] = {
          ...data
        }
      })
    }
  })
  fs.writeFileSync(targetFile, JSON.stringify(dataAll))
  ctx.body = data
});

function format(date, fmt) {
  let obj = {
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    "M+": date.getMonth() + 1, //月
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分钟
    "s+": date.getSeconds(), //秒
    "S": date.getMilliseconds() //毫秒  
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length))
  }
  for (let key in obj) {
    if (new RegExp("(" + key + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (obj[key]) : (("00" + obj[key]).substr(("" + obj[key]).length)));
    }
  }
  return fmt;
}

module.exports = router;
