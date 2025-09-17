import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { knex } from '../src/database.js'

describe('Users routes', () => {
  beforeAll(async () => {
    try {
      await knex.migrate.latest()
    } catch (error) {
      // Migrations may already exist, that's ok
    }
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clear database tables before each test in order (meals first due to foreign key)
    try {
      await knex('meals').del()
      await knex('users').del()
      // Reset auto-increment if using SQLite
      await knex.raw("DELETE FROM sqlite_sequence WHERE name IN ('users', 'meals')")
    } catch (error) {
      // Ignore errors during cleanup
    }
  })

  it('should be able to create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.create@example.com',
      })
      .expect(201)

    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.create@example.com',
      }),
    )
  })

  it('should not be able to create a user with existing email', async () => {
    const email = 'john.duplicate@example.com'
    
    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email,
      })
      .expect(201)

    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe 2',
        email,
      })
      .expect(400)
  })

  it('should be able to get user profile', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.profile@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const getUserResponse = await request(app.server)
      .get('/users/me')
      .set('Cookie', cookies || [])
      .expect(200)

    expect(getUserResponse.body.user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.profile@example.com',
        created_at: expect.any(String),
      }),
    )
  })

  it('should not be able to get user profile without session', async () => {
    await request(app.server)
      .get('/users/me')
      .expect(401)
  })
})
