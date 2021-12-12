const { _ } = require('ndut-helper')

module.exports = function (fastify, builder, model, schema) {
  const { config } = fastify
  if (_.get(schema, 'feature.siteId')) builder.defineProperty(schema.name, 'siteId', {
    type: Number,
    required: false,
    index: true,
    precision: 0,
    default: 0
  })
  if (_.get(schema, 'feature.status')) builder.defineProperty(schema.name, 'status', {
    type: String,
    length: 10,
    required: false,
    index: true
  })
}
