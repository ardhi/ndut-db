const exec = require('./exec')

module.exports = async function (name, request, ...args) {
  const fn = exec.bind(this)
  return await fn(name, 'remove', request, ...args)
}
