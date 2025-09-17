import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { usersRoutes } from './routes/users.ts'
import { mealsRoutes } from './routes/meals.ts'
import { checkSessionIdExists } from './middlewares/check-session-id-exists.ts'
import { knex } from './database.ts'

export const app = fastify()

app.register(cookie)
app.decorate('checkSessionIdExists', checkSessionIdExists)
app.decorate('knex', knex)

app.register(usersRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})
