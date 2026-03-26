import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: 'missing_env', message: 'SUPABASE_URL or ANON_KEY not set' };
  }

  try {
    const supabase = createClient(url, key);

    // Test 1: REST API health (lightweight query)
    const start = Date.now();
    const { error } = await supabase.from('_test_ping').select('*').limit(1);
    const latency = Date.now() - start;

    // 42501 = insufficient_privilege or relation doesn't exist — both mean the API is responding
    //const apiHealthy = !error || error.code === '42P01' || error.code === 'PGRST116';
    const apiHealthy = !error || ['42P01', 'PGRST116', 'PGRST204', 'PGRST205'].includes(error.code);

    return {
      status: apiHealthy ? 'connected' : 'error',
      latency: `${latency}ms`,
      url,
      error: apiHealthy ? null : error.message,
      errorCode: error?.code,
    };
  } catch (err) {
    return { status: 'unreachable', message: err.message };
  }
}

export default async function Home() {
  const supaResult = await checkSupabase();
  const now = new Date().toISOString();

  const checks = [
    {
      label: 'Next.js Runtime',
      pass: true,
      detail: `Node ${process.version}`,
    },
    {
      label: 'Environment Variables',
      pass: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/https?:\/\//, '')
        : 'Not configured',
    },
    {
      label: 'Supabase API',
      pass: supaResult.status === 'connected',
      detail: supaResult.status === 'connected'
        ? `OK (${supaResult.latency})`
        : `${supaResult.error || supaResult.message || supaResult.status} [code: ${supaResult.errorCode || 'none'}]`,
    },
    {
      label: 'Coolify Deploy',
      pass: true,
      detail: `Rendered at ${now}`,
    },
  ];

  const allPassed = checks.every((c) => c.pass);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '80px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Homelab Pipeline Check</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 32 }}>
        Coolify → Traefik → Cloudflare Tunnel → Supabase
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {checks.map((check) => (
          <div
            key={check.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              background: check.pass ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${check.pass ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <span style={{ fontSize: 20 }}>{check.pass ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{check.label}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{check.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: '16px 20px',
          borderRadius: 8,
          background: allPassed ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${allPassed ? '#86efac' : '#fde68a'}`,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {allPassed
          ? '🎉 Full pipeline operational — ready to deploy real apps'
          : '⚠️ Some checks failed — review above'}
      </div>
    </div>
  );
}
