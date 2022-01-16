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
  const { fastGlob, getConfig, getNdutConfig } = this.ndut.helper
  const config = await getConfig()
  const interceptor = {}

  for (let n of config.nduts) {
    n = await getNdutConfig(n)
    const files = await fastGlob(`${n.dir}/ndutDb/interceptor/*.js`)
    build.call(this, files, interceptor)
  }

  return interceptor
}
