import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all suppliers
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create suppliers table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        city TEXT NOT NULL,
        company_name TEXT NOT NULL,
        title TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile_country_code TEXT DEFAULT '+91',
        mobile_number TEXT NOT NULL,
        address TEXT,
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_name);
      CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
    `)
    
    const result = await client.query(`
      SELECT id, city, company_name, title, first_name, last_name, email, 
             mobile_country_code, mobile_number, address, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM suppliers 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ suppliers: result.rows })
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new supplier
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { city, companyName, title, firstName, lastName, email, mobileCountryCode, mobileNumber, address } = body
    
    if (!companyName || !firstName || !lastName || !email || !mobileNumber) {
      return NextResponse.json({ error: 'Company name, first name, last name, email, and mobile number are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO suppliers (city, company_name, title, first_name, last_name, email, mobile_country_code, mobile_number, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, city, company_name, title, first_name, last_name, email, 
                mobile_country_code, mobile_number, address, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [city || '', companyName, title || '', firstName, lastName, email, mobileCountryCode || '+91', mobileNumber, address || ''])
    
    return NextResponse.json({ 
      supplier: result.rows[0],
      message: 'Supplier created successfully'
    })
  } catch (error) {
    console.error('Suppliers POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update supplier
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, city, companyName, title, firstName, lastName, email, mobileCountryCode, mobileNumber, address } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }
    
    if (!companyName || !firstName || !lastName || !email || !mobileNumber) {
      return NextResponse.json({ error: 'Company name, first name, last name, email, and mobile number are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE suppliers 
      SET city = $1, company_name = $2, title = $3, first_name = $4, last_name = $5, 
          email = $6, mobile_country_code = $7, mobile_number = $8, address = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING id, city, company_name, title, first_name, last_name, email, 
                mobile_country_code, mobile_number, address, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [city || '', companyName, title || '', firstName, lastName, email, mobileCountryCode || '+91', mobileNumber, address || '', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      supplier: result.rows[0],
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Suppliers PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE supplier
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
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM suppliers WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Suppliers DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


