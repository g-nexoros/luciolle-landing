import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().trim();

  if (!email || !email.includes('@')) {
    return Response.redirect(new URL('/?erreur=email', request.url), 302);
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': import.meta.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [Number(import.meta.env.BREVO_LIST_ID)],
        updateEnabled: true,
      }),
    });

    // 201 = créé, 204 = déjà existant mis à jour — les deux sont OK
    if (res.status === 201 || res.status === 204) {
      return Response.redirect(new URL('/?inscrit=1', request.url), 302);
    }

    const err = await res.json();
    console.error('Brevo error:', err);
    return Response.redirect(new URL('/?erreur=1', request.url), 302);

  } catch (e) {
    console.error('Subscribe error:', e);
    return Response.redirect(new URL('/?erreur=1', request.url), 302);
  }
};
