const { _ } = require('ndut-helper')
const path = require('path')

module.exports.sanitizeFile = function (conn, config, ext) {
  if (!conn.file) conn.file = `${conn.name}.${ext}`
  if (!path.isAbsolute(conn.file)) {
    const parts = path.parse(conn.file)
    conn.file = `${config.dataDir}/data/${parts.base}`
  }
  if (_.isEmpty(path.parse(conn.file).ext)) conn.file += `.${ext}`
}

module.exports.sanitizeMemory = function (conn, config) {
  module.exports.sanitizeFile(conn, config, 'json')
}

module.exports.sanitizeSqlite3 = function (conn, config) {
  module.exports.sanitizeFile(conn, config, 'sqlite3')
}
