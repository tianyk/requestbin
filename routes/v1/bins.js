const express = require('express');
const router = express.Router();
const BinService = require('../../service/bins');

router.post('/', (req, res, next) => {
    (async () => {
        let uid = req.signedCookies.uid;
        if (!uid) throw new Error('Cookies are disabled.');

        let private = req.body.private;
        let binid = await BinService.generate();
        await BinService.meta({ binid, uid, private: private === 'true' });
        res.redirect(`/${binid}?inspect`);
    })().catch(next);
});

module.exports = router;