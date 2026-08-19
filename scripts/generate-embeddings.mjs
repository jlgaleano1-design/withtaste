#!/usr/bin/env node
// Genera embeddings reales (Voyage AI) para cada criterio de app/ui-critique-repo.jsx
// y los guarda en docs/research/criterion-embeddings.json.
//
// POR QUÉ EXISTE ESTE SCRIPT COMO ARCHIVO SEPARADO (no corrido todavía, v1.10):
// api.voyageai.com está bloqueado por la política de egress de red del entorno
// donde se escribió este script (Claude Code en una sesión remota) — 403 en el
// CONNECT del proxy, confirmado con una key real. No es un problema de la key
// ni de este código: hace falta correr esto desde un entorno con acceso real a
// internet (tu compu, un CI, o un entorno de Claude Code con esa política más
// abierta).
//
// CÓMO CORRERLO:
//   export VOYAGE_API_KEY="tu-key-de-voyageai.com"
//   node scripts/generate-embeddings.mjs
//
// Requiere Node 18+ (usa fetch nativo). No tiene dependencias externas.
//
// SUPUESTO DE PARSEO: este script extrae los criterios leyendo el .jsx como
// texto plano, asumiendo que cada entrada de SEED_CRITERIA* es un objeto
// literal de una sola línea que empieza con `{ statement: "...".
// Si en el futuro se reformatean esos arrays a multi-línea, este parser hay
// que ajustarlo — no es un parser de JS real, es una extracción a propósito
// simple para no depender de un bundler ni de transformar JSX en Node.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSX_PATH = join(__dirname, "..", "app", "ui-critique-repo.jsx");
const OUT_PATH = join(__dirname, "..", "docs", "research", "criterion-embeddings.json");
const VOYAGE_MODEL = "voyage-3.5"; // ver https://docs.voyageai.com/docs/embeddings para alternativas
const BATCH_SIZE = 96; // límite práctico por request de la API de Voyage

const BATCHES = [
  { constName: "SEED_CRITERIA", idPrefix: "seed" },
  { constName: "SEED_CRITERIA_BATCH2", idPrefix: "seed2" },
  { constName: "SEED_CRITERIA_BATCH3", idPrefix: "seed3" },
  { constName: "SEED_CRITERIA_BATCH4", idPrefix: "seed4" },
  { constName: "SEED_CRITERIA_BATCH5", idPrefix: "seed5" },
];

function extractCriteria(jsxSource) {
  const criteria = [];
  for (const { constName, idPrefix } of BATCHES) {
    const startMarker = `const ${constName} = [`;
    const startIdx = jsxSource.indexOf(startMarker);
    if (startIdx === -1) throw new Error(`No encontré "${startMarker}" en el .jsx`);
    const endIdx = jsxSource.indexOf("\n].map(", startIdx);
    if (endIdx === -1) throw new Error(`No encontré el cierre de ${constName} (".map(")`);
    const block = jsxSource.slice(startIdx + startMarker.length, endIdx);

    const lineRe = /\{\s*statement:\s*"((?:[^"\\]|\\.)*)"/g;
    let match;
    let i = 0;
    while ((match = lineRe.exec(block)) !== null) {
      i += 1;
      const statement = match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
      const id = `${idPrefix}-${String(i).padStart(3, "0")}`;
      criteria.push({ id, statement });
    }
  }
  return criteria;
}

async function embedBatch(texts, apiKey) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL, input_type: "document" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage AI respondió ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

async function main() {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    console.error("Falta VOYAGE_API_KEY en el entorno. Ver cabecera de este archivo.");
    process.exit(1);
  }

  const jsxSource = readFileSync(JSX_PATH, "utf8");
  const criteria = extractCriteria(jsxSource);
  console.log(`Encontrados ${criteria.length} criterios para embeddear.`);

  const result = {};
  for (let i = 0; i < criteria.length; i += BATCH_SIZE) {
    const chunk = criteria.slice(i, i + BATCH_SIZE);
    console.log(`Embeddeando ${i + 1}-${i + chunk.length} de ${criteria.length}...`);
    const embeddings = await embedBatch(chunk.map((c) => c.statement), apiKey);
    chunk.forEach((c, j) => {
      result[c.id] = embeddings[j];
    });
  }

  const output = {
    model: VOYAGE_MODEL,
    dimensions: Object.values(result)[0]?.length ?? null,
    generatedAt: new Date().toISOString(),
    count: Object.keys(result).length,
    embeddings: result,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output));
  console.log(`Listo. Guardado en ${OUT_PATH} (${output.count} vectores de ${output.dimensions} dims).`);
  console.log("Próximo paso (no hecho todavía): cargar este JSON al storage del artefacto");
  console.log("bajo la clave `criterion-embedding:{id}` y usar cosineSimilarity() en el");
  console.log("retrieval en vez de (o además de) el matching por tag actual.");
}

// Similaridad coseno de referencia — misma función que se usaría en el .jsx
// una vez que haya embeddings reales para comparar. Pura, sin dependencias.
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
