const readdirSortTime = function (dir, timeKey = 'mtime') {
  const { fs } = this.ndut.helper
  return (
    fs.readdirSync(dir)
      .map(name => ({
        name,
        time: fs.statSync(`${dir}/${name}`)[timeKey].getTime()
      }))
      .sort((a, b) => (b.time - a.time)) // descending
      .map(f => f.name)
  )
}

const handlerSingle = async function ({ model, maxRowsPerPage, compress, keep = 0 }) {
  const { _, fs, getConfig, luxon, exportTo } = this.ndut.helper
  const { DateTime } = luxon
  const config = getConfig()
  const instance = this.ndutDb.model[model]
  if (!instance) {
    this.log.error(`Model '${model}' doesn't exists!`)
    return
  }
  let page = 1
  const base = DateTime.local().toFormat('yyyyMMdd-hhmm')
  for (;;) {
    let skip = (page - 1) * maxRowsPerPage
    const result = await instance.find({ limit: maxRowsPerPage, skip })
    if (result.length === 0) break
    page++
    const dir = `${config.dir.data}/db/backup/${model}`
    await fs.ensureDir(dir)
    const file = `${dir}/${base}.jsonl`
    await exportTo(file, result, { compress })
    if (keep > 0) {
      const files = readdirSortTime.call(this, dir)
      while (files.length > keep) {
        const idx = files.length - 1
        fs.unlinkSync(`${dir}/${files[idx]}`)
        _.pullAt(files, idx)
      }
    }
  }
}

const handlerMulti = async function ({ models, maxRowsPerPage, compress, keep }) {
  for (const model of models) {
    await handlerSingle.call(this, { model, maxRowsPerPage, compress, keep })
  }
}

module.exports = async function () {
  const { _, getNdutConfig } = this.ndut.helper
  const cfg = getNdutConfig('ndut-db')
  cfg.backup = cfg.backup || {}
  const jobs = []
  const perModel = _.keys(cfg.backup.perModel || {})
  const defaults = cfg.backup.defaults || {}
  const time = defaults.time || '3,33 * * *'
  const keep = defaults.keep || 0
  const max = 5000
  let maxRowsPerPage = defaults.maxRowsPerPage || max
  if (maxRowsPerPage > max) maxRowsPerPage = max
  const compress = defaults.compress || false
  for (const model of perModel) {
    const backup = cfg.backup.perModel[model]
    const params = _.pick(cfg.backup, ['maxRowsPerPage', 'compress', 'keep'])
    params.maxRowsPerPage = params.maxRowsPerPage || maxRowsPerPage
    if (params.maxRowsPerPage > max) params.maxRowsPerPage = max
    params.compress = params.compress || compress
    params.keep = params.keep || keep
    params.model = model
    jobs.push({
      time: backup.time || time,
      name: `backup${model}`,
      params,
      handler: handlerSingle
    })
  }
  if (!_.isEmpty(cfg.backup.models)) {
    const params = { maxRowsPerPage, compress, models: cfg.backup.models, keep }
    jobs.push({
      time,
      params,
      name: 'backupModels',
      handler: handlerMulti
    })
  }
  return jobs
}
