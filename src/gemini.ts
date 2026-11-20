import type { Env, ExtractedReceipt } from "./types";

const PROMPT = `You extract data from a screenshot of a Peruvian mobile payment receipt (Yape or Plin).
The receipt text is in Spanish.
- isReceipt: true only if the image is a Yape or Plin payment receipt; otherwise false and every other field null.
- app: "yape" or "plin".
- direction: "expense" when the user sent money ("Yapeaste", "Pagaste", "Enviaste"); "income" when the user received it ("Te yapearon", "Recibiste").
- amount: number in the receipt currency, e.g. 25.5.
- currency: ISO code; "S/" means "PEN".
- counterparty: the other person's or business's name as shown.
- occurredAt: date and time shown on the receipt, already in Peru time (UTC-5), formatted "YYYY-MM-DDTHH:MM". Spanish month names may appear (ene, feb, mar, abr, may, jun, jul, ago, set/sep, oct, nov, dic).
- operationId: the operation/transaction number ("Nro. de operación", "Código de operación").
If a field is not legible, return null. Never guess or invent values.`;

const nullable = (type: string, extra: object = {}) => ({ type: [type, "null"], ...extra });

const SCHEMA = {
  type: "object",
  properties: {
    isReceipt: { type: "boolean" },
    app: nullable("string", { enum: ["yape", "plin", null] }),
    direction: nullable("string", { enum: ["expense", "income", null] }),
    amount: nullable("number"),
    currency: nullable("string"),
    counterparty: nullable("string"),
    occurredAt: nullable("string"),
    operationId: nullable("string"),
  },
  required: ["isReceipt", "app", "direction", "amount", "currency", "counterparty", "occurredAt", "operationId"],
};

// Plain REST call instead of @google/genai: the SDK bloats the bundle and CPU time per request.
export async function extractReceipt(env: Env, imageBase64: string, mimeType: string): Promise<ExtractedReceipt> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCHEMA, temperature: 0 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 500)}`);
  return JSON.parse(text) as ExtractedReceipt;
}
