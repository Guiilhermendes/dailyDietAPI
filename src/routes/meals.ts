import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database.js'

export async function mealsRoutes(app: FastifyInstance) {
  // Create a meal
  app.post('/', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      dateTime: z.string().datetime(),
      isOnDiet: z.boolean(),
    })

    const { name, description, dateTime, isOnDiet } = createMealBodySchema.parse(request.body)

    const { sessionId } = request.cookies

    // Get user by session_id
    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const mealId = randomUUID()

    await knex('meals').insert({
      id: mealId,
      name,
      description,
      date_time: dateTime,
      is_on_diet: isOnDiet,
      user_id: user.id,
    })

    return reply.status(201).send({
      meal: {
        id: mealId,
        name,
        description,
        dateTime,
        isOnDiet,
      },
    })
  })

  // List all meals for user
  app.get('/', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const meals = await knex('meals')
      .where({ user_id: user.id })
      .orderBy('date_time', 'desc')

    const formattedMeals = meals.map(meal => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      dateTime: meal.date_time,
      isOnDiet: Boolean(meal.is_on_diet),
      createdAt: meal.created_at,
    }))

    return reply.send({
      meals: formattedMeals,
    })
  })

  // Get a specific meal
  app.get('/:id', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)
    const { sessionId } = request.cookies

    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const meal = await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({
        error: 'Meal not found.',
      })
    }

    return reply.send({
      meal: {
        id: meal.id,
        name: meal.name,
        description: meal.description,
        dateTime: meal.date_time,
        isOnDiet: Boolean(meal.is_on_diet),
        createdAt: meal.created_at,
      },
    })
  })

  // Update a meal
  app.put('/:id', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const updateMealBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      dateTime: z.string().datetime().optional(),
      isOnDiet: z.boolean().optional(),
    })

    const { id } = getMealParamsSchema.parse(request.params)
    const updateData = updateMealBodySchema.parse(request.body)
    const { sessionId } = request.cookies

    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const meal = await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({
        error: 'Meal not found.',
      })
    }

    const updatePayload: any = {}
    if (updateData.name) updatePayload.name = updateData.name
    if (updateData.description) updatePayload.description = updateData.description
    if (updateData.dateTime) updatePayload.date_time = updateData.dateTime
    if (updateData.isOnDiet !== undefined) updatePayload.is_on_diet = updateData.isOnDiet
    updatePayload.updated_at = knex.fn.now()

    await knex('meals')
      .where({ id })
      .update(updatePayload)

    return reply.status(204).send()
  })

  // Delete a meal
  app.delete('/:id', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)
    const { sessionId } = request.cookies

    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const meal = await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({
        error: 'Meal not found.',
      })
    }

    await knex('meals')
      .where({ id })
      .delete()

    return reply.status(204).send()
  })

  // Get user metrics
  app.get('/metrics', { preHandler: [app.checkSessionIdExists] }, async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found.',
      })
    }

    const totalMeals = await knex('meals')
      .where({ user_id: user.id })
      .count('id', { as: 'total' })
      .first()

    const totalMealsOnDiet = await knex('meals')
      .where({
        user_id: user.id,
        is_on_diet: true,
      })
      .count('id', { as: 'total' })
      .first()

    const totalMealsOffDiet = await knex('meals')
      .where({
        user_id: user.id,
        is_on_diet: false,
      })
      .count('id', { as: 'total' })
      .first()

    // Calculate best streak of meals on diet
    const meals = await knex('meals')
      .where({ user_id: user.id })
      .orderBy('date_time', 'asc')
      .select(['is_on_diet'])

    let bestOnDietSequence = 0
    let currentSequence = 0

    for (const meal of meals) {
      if (meal.is_on_diet) {
        currentSequence++
        if (currentSequence > bestOnDietSequence) {
          bestOnDietSequence = currentSequence
        }
      } else {
        currentSequence = 0
      }
    }

    return reply.send({
      totalMeals: totalMeals?.total || 0,
      totalMealsOnDiet: totalMealsOnDiet?.total || 0,
      totalMealsOffDiet: totalMealsOffDiet?.total || 0,
      bestOnDietSequence,
    })
  })
}
