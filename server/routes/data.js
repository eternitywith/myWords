const router = require('koa-router')(),
    fs = require('fs'),
    path = require('path');

let targetFile = path.join(__dirname,'../data/data.json')

router.get('/getData',  async (ctx, next) => {
    let data = JSON.parse(fs.readFileSync(targetFile))
    ctx.body = data;
});

router.post('/addData',  async (ctx, next) => {
    let data = JSON.parse(fs.readFileSync(targetFile))
    data.unshift({
        "id": data.length ,
        "context": ctx.request.body.data,
        "date": format(new Date(), 'yyyy-MM-dd-hh-mm'),
        "like": 0,
        "dislike": 0
    })
    fs.writeFileSync(targetFile, JSON.stringify(data))
    ctx.body = {
        "id": data.length,
        "context": ctx.request.body.data,
        "date": format(new Date(), 'yyyy-MM-dd-hh-mm'),
        "like": 0,
        "dislike": 0
    }
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