module.exports = {
  properties: {
    deletedAt: {
      type: Date,
      required: false,
      index: true
    }
  },
  handler: async function ({ builder, model, schema, options }) {
    const { _, getConfig } = this.ndut.helper
    const config = getConfig()
    if (config.appMode !== 'build') {
      model.observe('before delete', (ctx, next) => {
        model.updateAll(ctx.where, { deletedAt: new Date()}).then(function () {
          next(null)
        })
      })

      model.observe('access', (ctx, next) => {
        if (ctx.query.isDeleted) return next()
        if (ctx.query.where && JSON.stringify(ctx.query.where).indexOf('isDeleted') === 1) return next()
        if (!ctx.query.where) ctx.query.where = {}
        ctx.query.where.deletedAt = null
        next()
      })

      model.settings.hidden = ['deletedAt']
    }
  }
}
