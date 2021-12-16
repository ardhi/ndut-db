const path = require('path')

module.exports = async function (files, interceptor) {
  const { _ } = this.ndut.helper
  for (const f of files) {
    const fn = require(f).bind(this)
    const key = _.camelCase(path.basename(f, '.js'))
    if (!interceptor[key]) interceptor[key] = []
    interceptor[key].push(fn)
  }
}
