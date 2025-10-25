import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all package themes
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create package_themes table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS package_themes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_package_themes_name ON package_themes(name);
      CREATE INDEX IF NOT EXISTS idx_package_themes_status ON package_themes(status);
    `)
    
    const result = await client.query(`
      SELECT id, name, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM package_themes 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ packageThemes: result.rows })
  } catch (error) {
    console.error('Package Themes GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new package theme
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
      return NextResponse.json({ error: 'Package theme name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO package_themes (name, status)
      VALUES ($1, $2)
      RETURNING id, name, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, status || 'Active'])
    
    return NextResponse.json({ 
      packageTheme: result.rows[0],
      message: 'Package theme created successfully'
    })
  } catch (error) {
    console.error('Package Themes POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update package theme
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
      return NextResponse.json({ error: 'Package theme ID is required' }, { status: 400 })
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Package theme name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE package_themes 
      SET name = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Package theme not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      packageTheme: result.rows[0],
      message: 'Package theme updated successfully'
    })
  } catch (error) {
    console.error('Package Themes PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE package theme
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
      return NextResponse.json({ error: 'Package theme ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM package_themes WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Package theme not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Package theme deleted successfully' })
  } catch (error) {
    console.error('Package Themes DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


