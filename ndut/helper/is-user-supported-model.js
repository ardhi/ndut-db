module.exports = async function (instance) {
  const model = typeof instance === 'string' ? this.ndutDb.model[instance] : instance
  return !!model.definition.properties.userId
}
