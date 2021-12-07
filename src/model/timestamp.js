// based on: https://github.com/clovis-maniguet/loopback-timestamp-mixin/blob/master/time-stamp.js
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true })
  } else {
    obj[key] = value;
  }
  return obj
}

module.exports = function (builder, model, schema) {
  if (schema.createdAt) builder.defineProperty(schema.name, 'createdAt', {
    type: Date,
    required: false,
    defaultFn: 'now',
    mysql: {
      columnName: 'created_at',
      default: 'CURRENT_TIMESTAMP',
      dataType: 'timestamp'
    }
  })
  if (schema.updatedAt) builder.defineProperty(schema.name, 'updatedAt', {
    type: Date,
    required: false,
    mysql: {
      columnName: 'updated_at',
      dataType: 'timestamp',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y'
    }
  })
  if (schema.deletedAt) builder.defineProperty(schema.name, 'deletedAt', {
    type: Date,
    required: false,

    mysql: {
      columnName: 'deleted_at',
      dataType: 'timestamp',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y'
    }
  })
  if (schema.properties.createdAt || schema.properties.updatedAt) {
    model.observe('before save', (ctx, next) => {
      if (ctx.options && ctx.options.skipUpdatedAt) return next()
      if (ctx.instance) {
        if (ctx.isNewInstance && schema.properties.createdAt) ctx.instance.createdAt = new Date()
        if (schema.properties.updatedAt) ctx.instance.updatedAt = new Date()
      } else {
        if (schema.properties.updatedAt) ctx.data.updatedAt = new Date()
      }
      return next()
    })
  }

  if (schema.properties.deletedAt) {
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
