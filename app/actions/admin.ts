"use server";

import { createClient } from '@supabase/supabase-js';

export async function createNewTenant(data: any): Promise<any> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  if (authData.user) {
    const { error: tenantError } = await supabaseAdmin.from('tenants').insert({
      owner_id: authData.user.id,
      shop_name: data.shop_name,
      tenant_code: data.tenant_code.toLowerCase().replace(/\s+/g, ''),
      status: 'Active'
    });

    if (tenantError) return { error: tenantError.message };

    const { error: settingsError } = await supabaseAdmin.from('shop_settings').insert({
      user_id: authData.user.id,
      shop_name: data.shop_name,
      tenant_code: data.tenant_code.toLowerCase().replace(/\s+/g, ''),
    });

    if (settingsError) return { error: settingsError.message };

    return { success: true };
  }
  
  return { error: 'User creation failed unexpectedly.' };
}