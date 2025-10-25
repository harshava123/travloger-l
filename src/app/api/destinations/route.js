import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all destinations
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_destinations_name ON destinations(name);
    `)
    
    // Get all destinations
    const result = await client.query(`
      SELECT id, name, status, created_by, 
             TO_CHAR(created_at, 'DD-MM-YYYY') as date,
             created_at, updated_at
      FROM destinations 
      ORDER BY name ASC
    `)
    
    return NextResponse.json({ 
      destinations: result.rows 
    })
  } catch (error) {
    console.error('Destinations GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST - Create new destination
export async function POST(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, status = 'Active', created_by = 'Travloger.in' } = body
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Destination name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Insert new destination
    const result = await client.query(`
      INSERT INTO destinations (name, status, created_by)
      VALUES ($1, $2, $3)
      RETURNING id, name, status, created_by, 
                TO_CHAR(created_at, 'DD-MM-YYYY') as date,
                created_at, updated_at
    `, [name.trim(), status, created_by])
    
    return NextResponse.json({ 
      destination: result.rows[0],
      message: 'Destination created successfully'
    })
  } catch (error) {
    console.error('Destinations POST error:', error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Destination already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT - Update destination
export async function PUT(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Destination ID is required' }, { status: 400 })
    }
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Destination name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Update destination
    const result = await client.query(`
      UPDATE destinations 
      SET name = $1, 
          status = COALESCE($2, status),
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, status, created_by, 
                TO_CHAR(created_at, 'DD-MM-YYYY') as date,
                created_at, updated_at
    `, [name.trim(), status, id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      destination: result.rows[0],
      message: 'Destination updated successfully'
    })
  } catch (error) {
    console.error('Destinations PUT error:', error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Destination name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE - Delete destination
export async function DELETE(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Destination ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Delete destination
    const result = await client.query(`
      DELETE FROM destinations 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Destination deleted successfully'
    })
  } catch (error) {
    console.error('Destinations DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
