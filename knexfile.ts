// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database/app.db',
    },
    useNullAsDefault: true,
    migrations: {
      extension: 'js',
      directory: './database/migrations',
    },
  },

  test: {
    client: 'sqlite3',
    connection: {
      filename: './database/test.db',
    },
    useNullAsDefault: true,
    migrations: {
      extension: 'js',
      directory: './database/migrations',
    },
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './database/app.db',
    },
    useNullAsDefault: true,
    migrations: {
      extension: 'js',
      directory: './database/migrations',
    },
  },

};
