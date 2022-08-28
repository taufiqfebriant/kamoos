const { customAlphabet } = require('nanoid');

const customNanoId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 20);

module.exports = {
	customNanoId
};
