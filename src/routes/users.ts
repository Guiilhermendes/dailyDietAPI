import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database.js'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    const { name, email } = createUserBodySchema.parse(request.body)

    // Check if user already exists
    const existingUser = await knex('users').where({ email }).first()

    if (existingUser) {
      return reply.status(400).send({
        error: 'User already exists with this email.',
      })
    }

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const userId = randomUUID()

    await knex('users').insert({
      id: userId,
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send({
      user: {
        id: userId,
        name,
        email,
      },
    })
  })

  app.get('/me', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users')
      .where({ session_id: sessionId })
      .select(['id', 'name', 'email', 'created_at'])
      .first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    return reply.send({
      user,
    })
  })
}
