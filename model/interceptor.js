const path = require('path')

module.exports = async function (fastify, files, interceptor) {
  const { _ } = fastify.ndut.helper
  for (const f of files) {
    const fn = require(f).bind(fastify)
    const key = _.camelCase(path.basename(f, '.js'))
    if (!interceptor[key]) interceptor[key] = []
    interceptor[key].push(fn)
  }
}