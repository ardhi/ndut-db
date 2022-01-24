const path = require('path')

const build = async function (files, interceptor) {
  const { _, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  for (const f of files) {
    let mod = require(f)
    if (_.isFunction(mod)) mod = { before: mod.bind(this) }
    else {
      if (_.isFunction(mod.before)) mod.before = mod.before.bind(this)
      if (_.isFunction(mod.after)) mod.after = mod.after.bind(this)
    }
    const bases = path.basename(f, '.js').split('@')
    let key = _.camelCase(bases[0])
    if (bases[1]) key += '@' + pascalCase(bases[1])

    if (!interceptor[key]) interceptor[key] = []
    interceptor[key].push(mod)
  }
}

module.exports = async function () {
  const { fastGlob, getConfig, getNdutConfig } = this.ndut.helper
  const config = await getConfig()
  const interceptor = {}

  for (let n of config.nduts) {
    n = await getNdutConfig(n)
    const files = await fastGlob(`${n.dir}/ndutDb/interceptor/{count,find,find-one,create,update,remove}*.js`)
    build.call(this, files, interceptor)
  }

  return interceptor
}
