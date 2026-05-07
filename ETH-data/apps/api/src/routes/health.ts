import type { FastifyInstance } from 'fastify'

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' }
            },
            required: ['status']
          }
        }
      }
    },
    async () => ({ status: 'ok' })
  )
}
