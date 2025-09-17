import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { knex } from '../src/database.js'

describe('Meals routes', () => {
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

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals1@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    expect(createMealResponse.body.meal).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      }),
    )
  })

  it('should be able to list all meals for user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals2@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Lunch',
        description: 'Pizza',
        dateTime: '2023-10-01T12:00:00.000Z',
        isOnDiet: false,
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies || [])
      .expect(200)

    expect(listMealsResponse.body.meals).toHaveLength(2)
    expect(listMealsResponse.body.meals[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        dateTime: expect.any(String),
        isOnDiet: expect.any(Boolean),
      }),
    )
  })

  it('should be able to get a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals3@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    const mealId = createMealResponse.body.meal.id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies || [])
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        id: mealId,
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      }),
    )
  })

  it('should be able to update a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals4@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    const mealId = createMealResponse.body.meal.id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies || [])
      .send({
        name: 'Updated Breakfast',
        isOnDiet: false,
      })
      .expect(204)
  })

  it('should be able to delete a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals5@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    const mealId = createMealResponse.body.meal.id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies || [])
      .expect(204)
  })

  it('should be able to get user metrics', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.meals6@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    // Create meals on diet
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Lunch',
        description: 'Healthy lunch',
        dateTime: '2023-10-01T12:00:00.000Z',
        isOnDiet: true,
      })
      .expect(201)

    // Create meal off diet
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies || [])
      .send({
        name: 'Dinner',
        description: 'Pizza',
        dateTime: '2023-10-01T19:00:00.000Z',
        isOnDiet: false,
      })
      .expect(201)

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies || [])
      .expect(200)

    expect(metricsResponse.body).toEqual(
      expect.objectContaining({
        totalMeals: 3,
        totalMealsOnDiet: 2,
        totalMealsOffDiet: 1,
        bestOnDietSequence: 2,
      }),
    )
  })

  it('should not be able to access meals without session', async () => {
    await request(app.server)
      .get('/meals')
      .expect(401)

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Breakfast',
        description: 'Healthy breakfast with fruits',
        dateTime: '2023-10-01T08:00:00.000Z',
        isOnDiet: true,
      })
      .expect(401)
  })
})
