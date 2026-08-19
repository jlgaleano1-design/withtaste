// Función serverless de Vercel: proxy hacia la API de Claude.
//
// La app llamaba antes directo a https://api.anthropic.com/v1/messages desde
// el navegador — eso funcionaba dentro del sandbox de artifacts de Claude.ai
// porque la autenticación se inyecta ahí de forma invisible. Fuera de ese
// sandbox esa llamada no tiene credenciales y además expondría la API key a
// cualquiera que abra las herramientas de desarrollador si se la pusiera en
// el código del cliente. Esta función guarda la key del lado del servidor
// (ANTHROPIC_API_KEY, variable de entorno de Vercel) y reenvía el mismo
// body que ya mandaba el cliente, devolviendo la respuesta de Anthropic tal
// cual — el resto de la app no cambia cómo lee la respuesta.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." });
    return;
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo contactar a la API de Anthropic.", detail: String(err) });
  }
}
