import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all room types
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create room_types table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_room_types_name ON room_types(name);
      CREATE INDEX IF NOT EXISTS idx_room_types_status ON room_types(status);
    `)
    
    const result = await client.query(`
      SELECT id, name, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM room_types 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ roomTypes: result.rows })
  } catch (error) {
    console.error('Room Types GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new room type
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, status } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO room_types (name, status)
      VALUES ($1, $2)
      RETURNING id, name, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, status || 'Active'])
    
    return NextResponse.json({ 
      roomType: result.rows[0],
      message: 'Room type created successfully'
    })
  } catch (error) {
    console.error('Room Types POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update room type
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Room type ID is required' }, { status: 400 })
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE room_types 
      SET name = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      roomType: result.rows[0],
      message: 'Room type updated successfully'
    })
  } catch (error) {
    console.error('Room Types PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE room type
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
      return NextResponse.json({ error: 'Room type ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM room_types WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Room type deleted successfully' })
  } catch (error) {
    console.error('Room Types DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


