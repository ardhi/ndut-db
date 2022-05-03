module.exports = {
  properties: {
    createdAt: {
      type: Date,
      required: false,
      index: true
    }
  },
  handler: async function ({ builder, model, schema, options }) {
    model.observe('before save', (ctx, next) => {
      if (ctx.options && ctx.options.skipCreatedAt) return next()
      if (ctx.instance && ctx.isNewInstance) ctx.instance.createdAt = new Date()
      next()
    })
  }
}
