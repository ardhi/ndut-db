module.exports = async function ({ builder, model, schema, options }) {
  if (!model.definition.properties.createdAt) {
    builder.defineProperty(schema.name, 'createdAt', {
      type: Date,
      required: false,
      index: true
    })
  }
  model.observe('before save', (ctx, next) => {
    if (ctx.options && ctx.options.skipCreatedAt) return next()
    if (ctx.instance && ctx.isNewInstance) ctx.instance.createdAt = new Date()
    next()
  })
}
