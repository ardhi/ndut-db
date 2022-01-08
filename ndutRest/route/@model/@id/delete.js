module.exports = async function () {
  const { handler } = await this.ndutRest.helper.modelAsRemoveRoute()
  return {
    handler,
    schema: {
      description: 'Remove record by its ID',
      tags: ['DB'],
      params: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            description: 'Model ID'
          },
          id: {
            type: 'string',
            description: 'Record ID'
          }
        }
      }
    }
  }
}
