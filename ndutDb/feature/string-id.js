module.exports = {
  properties: {
    id: {
      type: String,
      length: 20,
      required: false,
      id: true
    }
  },
  handler: async function ({ builder, model, schema, options }) {
    let generateId = options.generateIdFn
    if (!generateId) {
      generateId = (item) => {
        if (item) return item
        return this.ndutDb.helper.generateId(options)
      }
    }
    model.observe('before save', (ctx, next) => {
      if (ctx.instance && ctx.isNewInstance) ctx.instance.id = generateId(ctx.instance.id)
      next()
    })
  }
}
