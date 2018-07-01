const randomstring = require('randomstring');
const _ = require('lodash');
const is = require('is-type-of');
const DB = require('../models').DB;
const META_SUFFIX = ':meta';
const BINS_SUFFIX = ':bins';

// n4N9COuJ:meta {binid, createdAt, private, uid}
// n4N9COuJ:bins [{binid, method, pathname, header, body, ip..}]

async function exist(binid) {
    try {
        await DB.get(`${binid}${META_SUFFIX}`);
        return true;
    } catch (err) {
        if (err.type !== 'NotFoundError') throw err;
        return false;
    }
}

async function check(binid) {
    let existd = await exist(binid) ;
    if (!existd) throw new Error('Bin not exist.');
}

async function generate(len = 8, maxRetry = 20) {
    if (maxRetry <= 0) throw new Error('Max retries exceeded.');
    let binid = randomstring.generate(len);
    let existd = await exist(binid);
    if (existd) {
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
        if (err.notFound) return;
        throw err;
    }
}

async function getBins(binid) {
    await check(binid);

    try {
        let bins = await DB.get(`${binid}${BINS_SUFFIX}`);
        return JSON.parse(bins);
    } catch (err) {
        if (err.type !== 'NotFoundError') throw err;
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

exports.exist = exist;
exports.generate = generate;
exports.meta = meta;
exports.getMeta = getMeta;
exports.bin = bin;
exports.getBins = getBins;