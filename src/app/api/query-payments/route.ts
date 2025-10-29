import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all payments for a specific lead/query
export async function GET(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('queryId')
    
    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }

    // Try to query the table
    const result = await client.query(`
      SELECT * FROM query_payments 
      WHERE query_id = $1
      ORDER BY payment_date DESC
    `, [queryId])
    
    return NextResponse.json({ payments: result.rows })
  } catch (error: any) {
    console.error('Query payments GET error:', error)
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return NextResponse.json({ payments: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST - Add new payment for a query
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { queryId, transId, type, amount, paymentDate, status, convenienceFee } = body
    
    if (!queryId || !amount || !paymentDate || !status) {
      return NextResponse.json({ error: 'Query ID, amount, payment date, and status are required' }, { status: 400 })
    }
    
    await client.connect()

    // Auto-create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_payments (
        id SERIAL PRIMARY KEY,
        query_id TEXT NOT NULL,
        trans_id TEXT,
        type TEXT,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        status TEXT NOT NULL,
        convenience_fee DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_query_payments_query_id ON query_payments(query_id);
      CREATE INDEX IF NOT EXISTS idx_query_payments_status ON query_payments(status);
    `)
    
    const result = await client.query(`
      INSERT INTO query_payments (query_id, trans_id, type, amount, payment_date, status, convenience_fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [queryId, transId || null, type || null, amount, paymentDate, status, convenienceFee || 0])
    
    return NextResponse.json({ 
      payment: result.rows[0],
      message: 'Payment added successfully'
    })
  } catch (error: any) {
    console.error('Query payments POST error:', error)
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE - Delete a payment
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
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM query_payments WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error: any) {
    console.error('Query payments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  } finally {
    await client.end()
  }
}

