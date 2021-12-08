const { _, getNdutConfig } = require('ndut-helper')

module.exports = function (fastify, input) {
  const config = getNdutConfig(fastify, 'ndut-rest')
  const output = {}
  _.forOwn(input, (v, k) => {
    if (_.has(config.resultKey, k)) output[config.resultKey[k]] = v
    else if (_.has(config.queryKey, k)) output[config.queryKey[k]] = v
    else output[k] = v
  })
  return output
}
