import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all hotels
export async function GET(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create hotels table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        category INTEGER DEFAULT 3,
        price DECIMAL(10,2) DEFAULT 0,
        address TEXT,
        phone TEXT,
        email TEXT,
        icon_url TEXT,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
      CREATE INDEX IF NOT EXISTS idx_hotels_destination ON hotels(destination);
      CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
      CREATE INDEX IF NOT EXISTS idx_hotels_category ON hotels(category);
    `)
    
    const result = await client.query(`
      SELECT id, name, destination, category, price, address, phone, email, 
             icon_url, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM hotels 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ hotels: result.rows })
  } catch (error) {
    console.error('Hotels GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new hotel
export async function POST(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, destination, category, price, address, phone, email, iconUrl, status } = body
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Hotel name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO hotels (name, destination, category, price, address, phone, email, icon_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, destination, category, price, address, phone, email, 
                icon_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, category || 3, price || 0, address || '', phone || '', email || '', iconUrl || '', status || 'Active'])
    
    return NextResponse.json({ 
      hotel: result.rows[0],
      message: 'Hotel created successfully'
    })
  } catch (error) {
    console.error('Hotels POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update hotel
export async function PUT(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, destination, category, price, address, phone, email, iconUrl, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
    }
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Hotel name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE hotels 
      SET name = $1, destination = $2, category = $3, price = $4, 
          address = $5, phone = $6, email = $7, icon_url = $8, status = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING id, name, destination, category, price, address, phone, email, 
                icon_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, category || 3, price || 0, address || '', phone || '', email || '', iconUrl || '', status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      hotel: result.rows[0],
      message: 'Hotel updated successfully'
    })
  } catch (error) {
    console.error('Hotels PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE hotel
export async function DELETE(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM hotels WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Hotel deleted successfully' })
  } catch (error) {
    console.error('Hotels DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

