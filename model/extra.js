module.exports = function (fastify, builder, model, schema) {
  const { _ } = fastify.ndut.helper
  // TODO: can only be updated by Admins
  if (_.get(schema, 'feature.siteId')) builder.defineProperty(schema.name, 'siteId', {
    type: Number,
    required: false,
    index: true,
    precision: 0,
    default: 0
  })
  // TODO: can only be updated by Admins
  if (_.get(schema, 'feature.status')) builder.defineProperty(schema.name, 'status', {
    type: String,
    length: 10,
    required: false,
    index: true
  })
}
