const levelup = require('levelup');
const leveldown = require('leveldown');
const path = require('path');

const db = levelup(leveldown(path.join(__dirname, '..', 'bins')));

module.exports.DB = db;