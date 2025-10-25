import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all day itineraries
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create day_itineraries table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS day_itineraries (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        detail TEXT,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_day_itineraries_title ON day_itineraries(title);
      CREATE INDEX IF NOT EXISTS idx_day_itineraries_status ON day_itineraries(status);
    `)
    
    const result = await client.query(`
      SELECT id, title, detail, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM day_itineraries 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ dayItineraries: result.rows })
  } catch (error) {
    console.error('Day Itineraries GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new day itinerary
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { title, detail, status } = body
    
    if (!title) {
      return NextResponse.json({ error: 'Day itinerary title is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO day_itineraries (title, detail, status)
      VALUES ($1, $2, $3)
      RETURNING id, title, detail, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [title, detail || '', status || 'Active'])
    
    return NextResponse.json({ 
      dayItinerary: result.rows[0],
      message: 'Day itinerary created successfully'
    })
  } catch (error) {
    console.error('Day Itineraries POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update day itinerary
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, title, detail, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Day itinerary ID is required' }, { status: 400 })
    }
    
    if (!title) {
      return NextResponse.json({ error: 'Day itinerary title is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE day_itineraries 
      SET title = $1, detail = $2, status = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, title, detail, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [title, detail || '', status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Day itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      dayItinerary: result.rows[0],
      message: 'Day itinerary updated successfully'
    })
  } catch (error) {
    console.error('Day Itineraries PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE day itinerary
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
      return NextResponse.json({ error: 'Day itinerary ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM day_itineraries WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Day itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Day itinerary deleted successfully' })
  } catch (error) {
    console.error('Day Itineraries DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


