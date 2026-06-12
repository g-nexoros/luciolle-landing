import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().trim();

  if (!email || !email.includes('@')) {
    return Response.redirect(new URL('/?erreur=email', request.url), 302);
  }

  const apiKey = import.meta.env.BREVO_API_KEY;
  const listId = Number(import.meta.env.BREVO_LIST_ID) || 3;

  if (!apiKey) {
    console.error('BREVO_API_KEY manquante');
    return Response.redirect(new URL('/?erreur=config', request.url), 302);
  }

  // Brevo supporte les deux formats : xkeysib- (ancien) et sk_live_ (nouveau)
  const isNewFormat = apiKey.startsWith('sk_live_') || apiKey.startsWith('sk_test_');
  const headers: Record<string, string> = {
    'accept': 'application/json',
    'content-type': 'application/json',
  };

  if (isNewFormat) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    headers['api-key'] = apiKey;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    const responseText = await res.text();
    console.log('Brevo status:', res.status, 'body:', responseText);

    if (res.status === 201 || res.status === 204) {
      return Response.redirect(new URL('/?inscrit=1', request.url), 302);
    }

    return Response.redirect(new URL(`/?erreur=${res.status}`, request.url), 302);

  } catch (e) {
    console.error('Subscribe error:', e);
    return Response.redirect(new URL('/?erreur=fetch', request.url), 302);
  }
};
