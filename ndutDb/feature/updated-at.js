module.exports = {
  properties: {
    updatedAt: {
      type: Date,
      required: false,
      index: true
    }
  },
  handler: async function ({ builder, model, schema, options }) {
    model.observe('before save', (ctx, next) => {
      if (ctx.options && ctx.options.skipUpdatedAt) return next()
      if (ctx.instance) ctx.instance.updatedAt = new Date()
      else ctx.data.updatedAt = new Date()
      next()
    })
  }
}
