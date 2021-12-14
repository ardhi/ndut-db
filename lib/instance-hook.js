const path = require('path')

module.exports = function (fastify, datasource, model) {
  const { _ } = fastify.ndut.helper

  fastify.addHook('onClose', async (instance, done) => {
    for (const k of _.keys(datasource)) {
      fastify.log.debug(`Closing datasource '${k}'`)
      await datasource[k].disconnect()
    }
    done()
  })

}
