import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all transfers
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create transfers table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        query_name TEXT NOT NULL,
        destination TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        content TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_transfers_query_name ON transfers(query_name);
      CREATE INDEX IF NOT EXISTS idx_transfers_destination ON transfers(destination);
      CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
    `)
    
    // Add missing columns if they don't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN
        -- Add content column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transfers' AND column_name='content') THEN
          ALTER TABLE transfers ADD COLUMN content TEXT DEFAULT '';
        END IF;
        
        -- Add photo_url column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transfers' AND column_name='photo_url') THEN
          ALTER TABLE transfers ADD COLUMN photo_url TEXT DEFAULT '';
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, query_name, destination, price, content, photo_url, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM transfers 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ transfers: result.rows })
  } catch (error) {
    console.error('Transfers GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new transfer
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { queryName, destination, price, content, photoUrl, status } = body
    
    if (!queryName || !destination) {
      return NextResponse.json({ error: 'Query name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO transfers (query_name, destination, price, content, photo_url, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, query_name, destination, price, content, photo_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [queryName, destination, price || 0, content || '', photoUrl || '', status || 'Active'])
    
    return NextResponse.json({ 
      transfer: result.rows[0],
      message: 'Transfer created successfully'
    })
  } catch (error) {
    console.error('Transfers POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update transfer
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, queryName, destination, price, content, photoUrl, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
    }
    
    if (!queryName || !destination) {
      return NextResponse.json({ error: 'Query name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE transfers 
      SET query_name = $1, destination = $2, price = $3, content = $4, photo_url = $5, status = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id, query_name, destination, price, content, photo_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [queryName, destination, price || 0, content || '', photoUrl || '', status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      transfer: result.rows[0],
      message: 'Transfer updated successfully'
    })
  } catch (error) {
    console.error('Transfers PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE transfer
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
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM transfers WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Transfers DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
