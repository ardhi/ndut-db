const path = require('path')
const { DataSource } = require('loopback-datasource-juggler')
const collectSchemas = require('../lib/collect-schemas')
const collectDatasources = require('../lib/collect-datasources')
const buildModel = require('../lib/instance/build-model')

const doBuild = require('../lib/build')
// instance
const builtIn = require('../lib/instance/built-in')
const instanceHook = require('../lib/instance/hook')

module.exports = async function () {
  const { _, aneka, getConfig } = this.ndut.helper
  const { requireDeep } = aneka
  const config = getConfig()
  await collectDatasources.call(this)
  await collectSchemas.call(this)

  const { dataSources, schemas } = this.ndutDb

  const ds = {}
  for (const db of dataSources) {
    this.log.debug(`* Datasource '${db.name}'`)
    if (db.connector === 'memory') ds[db.name] = new DataSource(db)
    else {
      const name = db.connector
      db.connector = requireDeep(db.connector)
      ds[db.name] = new DataSource(db)
      db.connector = name
    }
  }
  this.ndutDb.dataSourceInstance = ds

  for (const schema of schemas) {
    this.log.debug(`* Model '${schema.name}' on '${schema.dataSource}'`)
    await buildModel.call(this, schema)
  }
  instanceHook.call(this)
  if (config.appMode === 'build') await doBuild.call(this)
  await builtIn.call(this)
}
