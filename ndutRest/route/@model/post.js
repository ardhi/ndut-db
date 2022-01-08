module.exports = async function () {
  const { handler } = await this.ndutRest.helper.modelAsCreateRoute()
  return {
    handler,
    schema: {
      description: 'Create and persist data',
      tags: ['DB'],
      params: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            description: 'Model ID'
          }
        }
      },
      body: {
        type: 'object'
      }
    }
  }
}
