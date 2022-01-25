module.exports = async function ({ builder, model, schema, options }) {
  if (!model.definition.properties.updatedAt) {
    builder.defineProperty(schema.name, 'updatedAt', {
      type: Date,
      required: false,
      index: true
    })
  }
  model.observe('before save', (ctx, next) => {
    if (ctx.options && ctx.options.skipUpdatedAt) return next()
    if (ctx.instance) ctx.instance.updatedAt = new Date()
    else ctx.data.updatedAt = new Date()
    next()
  })
}
