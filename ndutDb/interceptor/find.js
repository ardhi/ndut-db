module.exports = async function (model, request, ...args) {
  const private = await this.ndutDb.helper.isPrivateModel(model)
  if (private && request.user) args[0] = { where: { userId: request.user.id } }
  return args
}
