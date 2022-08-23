const importFixture = require('./import-fixture')

module.exports = async function (model, silent) {
  await importFixture.call(this, model, silent, 'sample')
}
