import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all query statuses
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create query_statuses table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_statuses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        take_note BOOLEAN DEFAULT false,
        lock_status BOOLEAN DEFAULT false,
        dashboard BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_query_statuses_name ON query_statuses(name);
      CREATE INDEX IF NOT EXISTS idx_query_statuses_status ON query_statuses(status);
    `)
    
    const result = await client.query(`
      SELECT id, name, color, take_note, lock_status, dashboard, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM query_statuses 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ queryStatuses: result.rows })
  } catch (error) {
    console.error('Query Statuses GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new query status
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, color, takeNote, lockStatus, dashboard, status } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Query status name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO query_statuses (name, color, take_note, lock_status, dashboard, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, color, take_note, lock_status, dashboard, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, color || '#3B82F6', takeNote || false, lockStatus || false, dashboard || false, status || 'Active'])
    
    return NextResponse.json({ 
      queryStatus: result.rows[0],
      message: 'Query status created successfully'
    })
  } catch (error) {
    console.error('Query Statuses POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update query status
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, color, takeNote, lockStatus, dashboard, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Query status ID is required' }, { status: 400 })
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Query status name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE query_statuses 
      SET name = $1, color = $2, take_note = $3, lock_status = $4, dashboard = $5, status = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id, name, color, take_note, lock_status, dashboard, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, color || '#3B82F6', takeNote || false, lockStatus || false, dashboard || false, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Query status not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      queryStatus: result.rows[0],
      message: 'Query status updated successfully'
    })
  } catch (error) {
    console.error('Query Statuses PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE query status
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
      return NextResponse.json({ error: 'Query status ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM query_statuses WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Query status not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Query status deleted successfully' })
  } catch (error) {
    console.error('Query Statuses DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


