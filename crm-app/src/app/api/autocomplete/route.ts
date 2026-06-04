import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAutocompleteSuggestions, saveAutocompleteValue } from '@/lib/db/queries/autocomplete'
import { z } from 'zod'

const fieldTypeSchema = z.enum(['college', 'qualification', 'degree', 'skill', 'company', 'occupation'])

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const fieldType = fieldTypeSchema.parse(searchParams.get('fieldType'))
      const search = searchParams.get('search') || undefined
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

      const data = await getAutocompleteSuggestions(fieldType, search, limit)
      return NextResponse.json({ data })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid field type' }, { status: 400 })
      }
      console.error('GET /api/autocomplete error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

const saveSchema = z.object({
  fieldType: fieldTypeSchema,
  value: z.string().min(2, 'Value must be at least 2 characters'),
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validated = saveSchema.parse(body)
      await saveAutocompleteValue(validated.fieldType, validated.value, user.userId)
      return NextResponse.json({ message: 'Value saved' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/autocomplete error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}