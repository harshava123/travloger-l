import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all meal plans
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create meal_plans table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meal_plans_name ON meal_plans(name);
      CREATE INDEX IF NOT EXISTS idx_meal_plans_destination ON meal_plans(destination);
      CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);
    `)
    
    const result = await client.query(`
      SELECT id, name, destination, meal_type, price, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM meal_plans 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ mealPlans: result.rows })
  } catch (error) {
    console.error('Meal Plans GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new meal plan
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, destination, mealType, price, status } = body
    
    if (!name || !destination || !mealType) {
      return NextResponse.json({ error: 'Meal plan name, destination, and meal type are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO meal_plans (name, destination, meal_type, price, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, destination, meal_type, price, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, mealType, price || 0, status || 'Active'])
    
    return NextResponse.json({ 
      mealPlan: result.rows[0],
      message: 'Meal plan created successfully'
    })
  } catch (error) {
    console.error('Meal Plans POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update meal plan
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, destination, mealType, price, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Meal plan ID is required' }, { status: 400 })
    }
    
    if (!name || !destination || !mealType) {
      return NextResponse.json({ error: 'Meal plan name, destination, and meal type are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE meal_plans 
      SET name = $1, destination = $2, meal_type = $3, price = $4, status = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, destination, meal_type, price, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, destination, mealType, price || 0, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      mealPlan: result.rows[0],
      message: 'Meal plan updated successfully'
    })
  } catch (error) {
    console.error('Meal Plans PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE meal plan
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
      return NextResponse.json({ error: 'Meal plan ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM meal_plans WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Meal plan deleted successfully' })
  } catch (error) {
    console.error('Meal Plans DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


