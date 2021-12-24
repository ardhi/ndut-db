const exec = require('./exec')

module.exports = async function (name, request, ...args) {
  const fn = exec.bind(this)
  return await fn(name, 'update', request, args[0], args[1])
}
