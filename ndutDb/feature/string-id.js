module.exports = {
  properties: {
    id: {
      type: String,
      length: 50,
      required: false,
      id: true
    }
  },
  handler: async function ({ builder, model, schema, options }) {
    const { aneka } = this.ndut.helper
    let generateId = options.generateIdFn
    if (!generateId) {
      generateId = (item) => {
        if (aneka.isSet(item)) return item
        return this.ndutDb.helper.generateId(options)
      }
    }
    model.observe('before save', (ctx, next) => {
      if (ctx.instance && ctx.isNewInstance) ctx.instance.id = generateId(ctx.instance.id)
      next()
    })
  }
}
