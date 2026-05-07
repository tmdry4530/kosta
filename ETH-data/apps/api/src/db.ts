import postgres, { type Sql } from 'postgres'

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://whales:whales@localhost:5432/whales'

let client: Sql | null = null

export function getDb(): Sql {
  if (client !== null) {
    return client
  }

  client = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: true,
    transform: {
      undefined: null
    }
  })

  return client
}

export async function closeDb(): Promise<void> {
  if (client === null) {
    return
  }
  await client.end({ timeout: 5 })
  client = null
}
