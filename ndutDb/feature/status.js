module.exports = async function ({ builder, model, schema, options }) {
  if (!model.definition.properties.status) {
    builder.defineProperty(schema.name, 'status', {
      type: String,
      length: 10,
      required: false,
      index: true
    })
  }
}
