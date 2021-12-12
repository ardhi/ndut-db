module.exports = async function (name, method, request, ...args) {
  const model = this.ndutDb.model[name]
  return await model[method](...args)
}
