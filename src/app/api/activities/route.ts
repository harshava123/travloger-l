import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all activities
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create activities table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name);
      CREATE INDEX IF NOT EXISTS idx_activities_destination ON activities(destination);
      CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
    `)
    
    const result = await client.query(`
      SELECT id, name, destination, price, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM activities 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ activities: result.rows })
  } catch (error) {
    console.error('Activities GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new activity
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, destination, price, status } = body
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Activity name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO activities (name, destination, price, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, destination, price, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, price || 0, status || 'Active'])
    
    return NextResponse.json({ 
      activity: result.rows[0],
      message: 'Activity created successfully'
    })
  } catch (error) {
    console.error('Activities POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update activity
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, destination, price, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Activity name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE activities 
      SET name = $1, destination = $2, price = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, destination, price, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, price || 0, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      activity: result.rows[0],
      message: 'Activity updated successfully'
    })
  } catch (error) {
    console.error('Activities PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE activity
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM activities WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Activities DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


