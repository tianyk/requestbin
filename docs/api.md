### GET / 
主页

### GET /:binid([a-zA-Z0-9]{6,10})
> query 包含 inspect 
展示页

### [GET|POST|PUT|DELETE|*] /:binid([a-zA-Z0-9]{6,10})
接受请求API

### POST /api/v1/bins
创建bin

| 参数名   |  类型    |     说明     |
| ------- | ------- | ----------- |
| private | Boolean | 是否是私有bin |
