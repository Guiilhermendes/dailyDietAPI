import { FastifyRequest, FastifyReply } from 'fastify'
import { Knex } from 'knex'

declare module 'fastify' {
  interface FastifyInstance {
    checkSessionIdExists: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    knex: Knex
  }

  interface FastifyRequest {
    cookies: {
      sessionId?: string
    }
  }

  interface FastifyReply {
    cookie(name: string, value: string, options?: any): FastifyReply
  }
}
