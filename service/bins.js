const randomstring = require('randomstring');
const _ = require('lodash');
const is = require('is-type-of');
const DB = require('../models').DB;
const META_SUFFIX = ':meta';
const BINS_SUFFIX = ':bins';

// n4N9COuJ:meta {binid, createdAt, private, uid}
// n4N9COuJ:bins [{binid, method, pathname, header, body, ip..}]

function isNotFoundError(err) {
    return err.type === 'NotFoundError';
}

async function exist(binid) {
    try {
        await DB.get(`${binid}${META_SUFFIX}`);
        return true;
    } catch (err) {
        if (!isNotFoundError(err)) throw err;
        return false;
    }
}

async function check(binid) {
    let existed = await exist(binid);
    if (!existed) throw new Error(`Bin ${binid} not exist.`);
}

async function generate(len = 8, maxRetry = 20) {
    if (maxRetry <= 0) throw new Error('Max retries exceeded.');
    let binid = randomstring.generate(len);
    let existed = await exist(binid);
    if (existed) {
        console.log('existed: %s', binid);
        return generate(len, maxRetry--);
    } else {
        return binid;
    }
}

async function meta({ binid, private = false, uid, createdAt = _.now() }) {
    let bin = {
        binid,
        private,
        uid,
        createdAt
    };
    await DB.put(`${binid}${META_SUFFIX}`, JSON.stringify(bin));
    return bin;
}

async function getMeta(binid) {
    try {
        let meta = await DB.get(`${binid}${META_SUFFIX}`);
        return JSON.parse(meta);
    } catch (err) {
        if (!isNotFoundError(err)) throw err;
    }
}

async function getBins(binid) {
    await check(binid);

    try {
        let bins = await DB.get(`${binid}${BINS_SUFFIX}`);
        return JSON.parse(bins);
    } catch (err) {
        // ignore NotFoundError
        // @see https://github.com/level/levelup#dbgetkey-options-callback
        if (!isNotFoundError(err)) throw err;
    }
}

async function bin({ binid, method = 'GET', pathname, version = '1.1', headers, query, body, ip, createdAt = _.now() }) {
    await check(binid);

    let bin = {
        binid,
        method,
        pathname,
        version,
        headers,
        query,
        body,
        ip,
        createdAt
    };

    let bins = await getBins(binid);
    if (bins && is.array(bins)) {
        bins.push(bin);
    } else {
        bins = [bin];
    }

    await DB.put(`${binid}${BINS_SUFFIX}`, JSON.stringify(bins));
    return bins;
}

async function del(binid) {
    if (!binid) throw new Error('[del] binid is required.');

    await Promise.all([
        DB.del(`${binid}${META_SUFFIX}`),
        DB.del(`${binid}${BINS_SUFFIX}`)
    ]);
}

function gc({ expire, gt, limit = 100, cb = _.noop }) {
    let count = 0;
    DB.createReadStream({ gt, limit })
        .on('data', function (data) {
            count++;
            gt = data.key;

            if (/[a-zA-Z0-9]{6,10}:meta/.test(data.key)) {
                let meta = JSON.parse(data.value);
                if (meta.createdAt < expire) del(meta.binid);
            }
        })
        .on('error', cb)
        .on('end', () => {
            if (count === limit) {
                // 可能有更多
                gc({ expire, gt, limit, cb });
            } else {
                // 已经遍历结束
                cb();
            }
        });
    // .on('close', () => {
    //     console.log('Stream closed')
    // });
}

exports.exist = exist;
exports.generate = generate;
exports.meta = meta;
exports.getMeta = getMeta;
exports.bin = bin;
exports.getBins = getBins;
exports.gc = gc;