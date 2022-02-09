const path = require('path')

module.exports = function () {
  const datasource = this.ndutDb.dataSourceInstance
  const { _ } = this.ndut.helper

  this.addHook('onClose', async (instance, done) => {
    for (const k of _.keys(datasource)) {
      this.log.debug(`Closing datasource '${k}'`)
      await datasource[k].disconnect()
    }
    done()
  })

}
