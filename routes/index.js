const uuid = require('uuid');
const ms = require('ms');
const express = require('express');
const router = express.Router();
const BinService = require('../service/bins');
router.use('/api', require('./api'));

/* GET home page. */
router.get('/', (req, res, next) => {
	if (!req.signedCookies.uid) res.cookie('uid', uuid.v4(), { maxAge: ms('1d'), signed: true });

	res.render('index', { title: 'RequestBin' });
});

router.all('/:binid([a-z-A-Z0-9]{6,10})', (req, res, next) => {
	(async () => {
		let uid = req.signedCookies.uid;
		let binid = req.params.binid;

		if (req.method === 'GET' && typeof req.query.inspect !== 'undefined') {
			let [meta, bins] = await Promise.all([BinService.getMeta(binid), BinService.getBins(binid)]);
			if (meta.private && meta.uid !== uid) throw new Error('Private bin.');

			res.render('inspect', { binid, bins });
		} else {
			let {
				method,
				path: pathname,
				httpVersion,
				headers,
				query,
				body,
				ips
			} = req;
			await BinService.bin({ binid, method, pathname, version: httpVersion, headers, query, body, ip: ips[0] })
			res.send('ok');
		}
	})().catch(next);
})

module.exports = router;
