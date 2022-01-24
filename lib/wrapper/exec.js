module.exports = async function (name, method, request, ...args) {
  const { _ } = this.ndut.helper
  const model = _.isString(name) ? this.ndutDb.model[name] : name
  if (this.ndutDb.interceptor[method]) {
    for (const obj of this.ndutDb.interceptor[method]) {
      if (_.isFunction(obj.before)) args = _.merge(args, await obj.before(model, request, ...args))
    }
  }
  if (this.ndutDb.interceptor[method + '@' + model.name]) {
    for (const obj of this.ndutDb.interceptor[method + '@' + model.name]) {
      if (_.isFunction(obj.before)) args = _.merge(args, await obj.before(model, request, ...args))
    }
  }
  let result
  if (method === 'findById') result = await model.findOne(...args)
  else if (['remove', 'create'].includes(method)) result = await model[method](args[0])
  else if (['update'].includes(method)) result = await model[method](args[0], args[1])
  else result = await model[method](...args)
  if (this.ndutDb.interceptor[method]) {
    for (const obj of this.ndutDb.interceptor[method]) {
      if (_.isFunction(obj.after)) {
        const resp = await obj.after(model, request, result, ...args)
        if (resp) result = _.merge(result, resp)
      }
    }
  }
  if (this.ndutDb.interceptor[method + '@' + model.name]) {
    for (const obj of this.ndutDb.interceptor[method + '@' + model.name]) {
      if (_.isFunction(obj.after)) {
        const resp = await obj.after(model, request, result, ...args)
        if (resp) result = _.merge(result, resp)
      }
    }
  }
  return result
}
