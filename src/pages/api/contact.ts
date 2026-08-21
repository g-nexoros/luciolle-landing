import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const name = data.get('name')?.toString().trim() || '';
  const email = data.get('email')?.toString().trim() || '';
  const subject = data.get('subject')?.toString() || 'autre';
  const message = data.get('message')?.toString().trim() || '';

  if (!name || !email || !message) {
    return new Response(null, { status: 302, headers: { Location: '/contact?erreur=champs' } });
  }

  const subjectLabels: Record<string, string> = {
    question: 'Question sur Luciolle',
    suggestion: 'Suggestion / fonctionnalité',
    bug: 'Signaler un problème',
    partenariat: 'Partenariat / presse',
    autre: 'Autre',
  };

  const apiKey = import.meta.env.BREVO_API_KEY;
  if (!apiKey) {
    return new Response(null, { status: 302, headers: { Location: '/contact?erreur=config' } });
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: 'Luciolle Contact', email: 'contact@luciolle.fr' },
      to: [{ email: 'contact@luciolle.fr', name: 'Luciolle' }],
      replyTo: { email, name },
      subject: `[Contact Luciolle] ${subjectLabels[subject] ?? subject} – ${name}`,
      htmlContent: `
        <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Sujet :</strong> ${subjectLabels[subject] ?? subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[contact] Brevo error', res.status, body);
    return new Response(null, { status: 302, headers: { Location: '/contact?erreur=envoi' } });
  }

  return new Response(null, { status: 302, headers: { Location: '/contact?sent=1' } });
};
