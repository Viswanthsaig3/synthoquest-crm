import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { revokeAllUserTokens } from '@/lib/db/queries/refresh-tokens'
import { createAdminClient } from '@/lib/db/server-client'

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const refreshToken = request.cookies.get('refreshToken')?.value
      
      if (refreshToken) {
        const supabase = await createAdminClient()
        
        const { data: tokenData } = await supabase
          .from('refresh_tokens')
          .select('id')
          .eq('token_hash', refreshToken)
          .single()
        
        if (tokenData) {
          await revokeAllUserTokens(user.userId)
        }
      }

      const response = NextResponse.json({
        message: 'Logged out successfully',
      })

      response.cookies.delete('refreshToken')

      return response
    } catch (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
