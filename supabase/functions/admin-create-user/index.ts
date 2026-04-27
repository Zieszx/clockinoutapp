import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return Response.json({ error: 'Missing authorization' }, { status: 401, headers: cors })

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !caller) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

    const { data: cp } = await admin.from('profiles').select('roles, company_id').eq('id', caller.id).single()
    const isSuperAdmin = cp?.roles?.includes('super_admin')
    const isAdmin = cp?.roles?.includes('admin')
    if (!isSuperAdmin && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors })

    const { full_name, email, password, roles, company_id } = await req.json()
    if (!full_name || !email || !password) {
      return Response.json({ error: 'full_name, email, and password are required' }, { status: 400, headers: cors })
    }

    const targetCompanyId = isSuperAdmin ? (company_id ?? null) : cp.company_id

    const { data: { user }, error: ce } = await admin.auth.admin.createUser({
      email: email.trim(), password, email_confirm: true,
    })
    if (ce) return Response.json({ error: ce.message }, { status: 400, headers: cors })

    const { error: pe } = await admin.from('profiles').upsert({
      id: user.id,
      email: email.trim(),
      full_name: full_name.trim(),
      roles: roles?.length ? roles : ['employee'],
      company_id: targetCompanyId,
      must_change_password: true,
    })
    if (pe) return Response.json({ error: pe.message }, { status: 400, headers: cors })

    return Response.json({ user: { id: user.id, email: user.email } }, { headers: cors })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: cors })
  }
})
