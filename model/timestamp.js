// based on: https://github.com/clovis-maniguet/loopback-timestamp-mixin/blob/master/time-stamp.js

module.exports = function (fastify, builder, model, schema) {
  const { _ } = fastify.ndut.helper
  const { config } = fastify
  const created = _.get(schema, 'feature.createdAt')
  const updated = _.get(schema, 'feature.updatedAt')
  const deleted = _.get(schema, 'feature.deletedAt')
  if (created) builder.defineProperty(schema.name, 'createdAt', {
    type: Date,
    required: false
  })
  if (updated) builder.defineProperty(schema.name, 'updatedAt', {
    type: Date,
    required: false
  })
  if (deleted) builder.defineProperty(schema.name, 'deletedAt', {
    type: Date,
    required: false
  })
  if (created || updated) {
    model.observe('before save', (ctx, next) => {
      if (ctx.options && ctx.options.skipUpdatedAt) return next()
      if (ctx.instance) {
        if (ctx.isNewInstance && created) ctx.instance.createdAt = new Date()
        if (updated) ctx.instance.updatedAt = new Date()
      } else {
        if (updated) ctx.data.updatedAt = new Date()
      }
      return next()
    })
  }

  if (deleted && config.appMode !== 'build') {
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
