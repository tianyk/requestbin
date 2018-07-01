const BinService = require('../service/bins');
const ms = require('ms');

function gc() {
    let expire = Date.now() - ms('1h');
    BinService.gc({ expire, limit: 100, cb: (err) => {
        let delay = 10 * 60 * 1000; // 10mins
        // console.log('gc')
        if (err) {
            console.error(err);
            delay = 60 * 1000; // 1min
        }

        // 下一轮清理
        const timer = setTimeout(gc, delay);
        timer.unref();
    }});
}

module.exports = gc;
