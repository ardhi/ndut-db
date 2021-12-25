module.exports = async function (name, method, request, ...args) {
  const { _ } = this.ndut.helper
  const model = this.ndutDb.model[name]
  if (this.ndutDb.interceptor[method]) {
    for (const fn of this.ndutDb.interceptor[method]) {
      args = _.merge(args, await fn(model, request, ...args))
    }
  }
  if (this.ndutDb.interceptor[method + '@' + name]) {
    for (const fn of this.ndutDb.interceptor[method + '@' + name]) {
      args = _.merge(args, await fn(model, request, ...args))
    }
  }
  if (method === 'findById') return await model.findOne(...args)
  if (['remove', 'create'].includes(method)) return await model[method](args[0])
  if (['update'].includes(method)) return await model[method](args[0], args[1])
  return await model[method](...args)
}
