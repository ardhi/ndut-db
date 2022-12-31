const { DataSource } = require('loopback-datasource-juggler')
const collectSchemas = require('../lib/collect-schemas')
const collectDatasources = require('../lib/collect-datasources')
const buildModel = require('../lib/instance/build-model')
const doBuild = require('../lib/build')
const doDump = require('../lib/dump')
// instance
const builtIn = require('../lib/instance/built-in')
const instanceHook = require('../lib/instance/hook')

module.exports = async function (options) {
  const { _, aneka, getConfig } = this.ndut.helper
  const { requireDeep } = aneka
  const { importFixture } = this.ndutDb.helper
  const config = getConfig()
  await collectDatasources.call(this, options)
  await collectSchemas.call(this, options)

  const { dataSources, schemas } = this.ndutDb

  const ds = {}
  for (const db of dataSources) {
    this.log.debug(`* Datasource '${db.name}'`)
    const name = db.connector
    db.connector = db.connector === 'loopback-connector-sqlite3' ? require('loopback-connector-sqlite3') : requireDeep(db.connector)
    ds[db.name] = new DataSource(db)
    db.connector = name
  }
  this.ndutDb.dataSourceInstance = ds
  for (const schema of schemas) {
    this.log.debug(`* Model '${schema.name}' on '${schema.dataSource}'`)
    await buildModel.call(this, schema)
  }
  if (config.appMode === 'build') await doBuild.call(this, options)
  if (config.appMode === 'dump') await doDump.call(this, options)
  // build memoryds
  const names = _.map(_.filter(schemas, { dataSource: 'memory' }), 'name')
  await ds.memory.automigrate(names)
  for (const n of names) {
    await importFixture(n, true)
  }

  instanceHook.call(this)
  await builtIn.call(this)
}
