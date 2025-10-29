import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { headers } from 'next/headers'

// GET hotel rates
export async function GET(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're expecting JSON
  if (contentType && !contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const url = new URL(request.url)
  const hotelId = url.searchParams.get('hotelId')

  if (!hotelId) {
    return new NextResponse(
      JSON.stringify({ error: 'Hotel ID is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create hotel_rates table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS hotel_rates (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        room_type TEXT NOT NULL,
        meal_plan TEXT NOT NULL DEFAULT 'APAI',
        single DECIMAL(10,2) DEFAULT 0,
        double DECIMAL(10,2) DEFAULT 0,
        triple DECIMAL(10,2) DEFAULT 0,
        quad DECIMAL(10,2) DEFAULT 0,
        cwb DECIMAL(10,2) DEFAULT 0,
        cnb DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_id ON hotel_rates(hotel_id);
      CREATE INDEX IF NOT EXISTS idx_hotel_rates_dates ON hotel_rates(from_date, to_date);
    `)
    
    const result = await client.query(`
      SELECT 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        created_at,
        updated_at
      FROM hotel_rates 
      WHERE hotel_id = $1
      ORDER BY from_date DESC, room_type
    `, [hotelId])
    
    return new NextResponse(
      JSON.stringify({ rates: result.rows }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotel rates GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// POST create new rate
export async function POST(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
  if (!contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { 
      hotelId, fromDate, toDate, roomType, mealPlan,
      single, double, triple, quad, cwb, cnb 
    } = body
    
    if (!hotelId || !fromDate || !toDate || !roomType) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel ID, dates, and room type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO hotel_rates (
        hotel_id, from_date, to_date, room_type, meal_plan,
        single, double, triple, quad, cwb, cnb
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        created_at,
        updated_at
    `, [
      hotelId, fromDate, toDate, roomType, mealPlan || 'APAI',
      single || 0, double || 0, triple || 0, quad || 0, cwb || 0, cnb || 0
    ])
    
    return new NextResponse(
      JSON.stringify({
        rate: result.rows[0],
        message: 'Rate created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotel rates POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// PUT update rate
export async function PUT(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
  if (!contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { 
      id, hotelId, fromDate, toDate, roomType, mealPlan,
      single, double, triple, quad, cwb, cnb 
    } = body
    
    if (!id || !hotelId || !fromDate || !toDate || !roomType) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate ID, hotel ID, dates, and room type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE hotel_rates 
      SET 
        from_date = $1,
        to_date = $2,
        room_type = $3,
        meal_plan = $4,
        single = $5,
        double = $6,
        triple = $7,
        quad = $8,
        cwb = $9,
        cnb = $10,
        updated_at = NOW()
      WHERE id = $11 AND hotel_id = $12
      RETURNING 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        created_at,
        updated_at
    `, [
      fromDate, toDate, roomType, mealPlan || 'APAI',
      single || 0, double || 0, triple || 0, quad || 0, cwb || 0, cnb || 0,
      id, hotelId
    ])
    
    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({
        rate: result.rows[0],
        message: 'Rate updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotel rates PUT error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// DELETE rate
export async function DELETE(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
  if (contentType && !contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM hotel_rates WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ message: 'Rate deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotel rates DELETE error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

