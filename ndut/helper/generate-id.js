const { customAlphabet } = require('nanoid')

module.exports = function (pattern, length = 10, returnInstance) {
  pattern = pattern || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  length = length || 10
  const nid = customAlphabet(pattern, length)
  return returnInstance ? nid : nid()
}
