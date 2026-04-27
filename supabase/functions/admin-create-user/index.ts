import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

type CreateUserPayload = {
  email: string
  password: string
  full_name: string
  role: 'employee' | 'admin'
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ message: 'Missing authorization header' }, { status: 401, headers: corsHeaders })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: currentUserData, error: currentUserError } = await userClient.auth.getUser()
    if (currentUserError || !currentUserData.user) {
      return Response.json({ message: 'Invalid session' }, { status: 401, headers: corsHeaders })
    }

    const { data: currentProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUserData.user.id)
      .single()

    if (profileError || currentProfile?.role !== 'admin') {
      return Response.json({ message: 'Admin access required' }, { status: 403, headers: corsHeaders })
    }

    const payload = await req.json() as CreateUserPayload
    if (!payload.email || !payload.password || !payload.full_name || !payload.role) {
      return Response.json({ message: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    const { data: createdUserData, error: createError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name
      }
    })

    if (createError || !createdUserData.user) {
      return Response.json({ message: createError?.message || 'Unable to create user' }, { status: 400, headers: corsHeaders })
    }

    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role
      })
      .eq('id', createdUserData.user.id)

    if (updateProfileError) {
      return Response.json({ message: updateProfileError.message }, { status: 400, headers: corsHeaders })
    }

    return Response.json({
      user: {
        id: createdUserData.user.id,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role
      }
    }, { status: 200, headers: corsHeaders })
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500, headers: corsHeaders })
  }
})
