const path = require('path')

module.exports = function (datasource, model) {
  const { _ } = this.ndut.helper

  this.addHook('onClose', async (instance, done) => {
    for (const k of _.keys(datasource)) {
      this.log.debug(`Closing datasource '${k}'`)
      await datasource[k].disconnect()
    }
    done()
  })

}
