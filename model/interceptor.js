const path = require('path')

const build = async function (files, interceptor) {
  const { _, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  for (const f of files) {
    const fn = require(f).bind(this)
    const bases = path.basename(f, '.js').split('@')
    let key = _.camelCase(bases[0])
    if (bases[1]) key += '@' + pascalCase(bases[1])
    if (!interceptor[key]) interceptor[key] = []
    interceptor[key].push(fn)
  }
}

module.exports = async function () {
  const { fastGlob } = this.ndut.helper
  const { config } = this
  const interceptor = {}

  for (const n of config.nduts) {
    const files = await fastGlob(`${n.dir}/ndutDb/interceptor/*.js`)
    build.call(this, files, interceptor)
  }
  const files = await fastGlob(`${config.dir.base}/ndutDb/interceptor/*.js`)
  build.call(this, files, interceptor)

  return interceptor
}
