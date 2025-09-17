import knexLib, { Knex } from 'knex'

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: process.env.NODE_ENV === 'test' ? './database/test.db' : './database/app.db',
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'js',
    directory: './database/migrations',
  },
}

export const knex = knexLib(config)
