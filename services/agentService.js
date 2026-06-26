import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import connection from "../database/connection.js";

const BASE_SYSTEM_PROMPT = [
    "Sei l'assistente ufficiale di reSea.",
    "Rispondi in italiano con tono chiaro, professionale e utile.",
    "Parla solo di temi legati al catalogo, ordini, sostenibilità e supporto clienti reSea.",
    "Non inventare prodotti non presenti nel contesto.",
    "Quando l'utente chiede per categoria (es. occhiali da sole, occhiali da vista, accessori), filtra usando le categorie presenti nel contesto.",
    "Restituisci testo semplice: niente markdown, niente blocchi codice."
].join(" ");

const agentModel = new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    apiKey: process.env.CLAUDE_API_KEY
});

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toSafeHtmlFragment(rawText) {
    const normalized = String(rawText || "")
        .replace(/\r\n/g, "\n")
        .trim();

    if (!normalized) {
        return "<p>Al momento non riesco a rispondere. Riprova tra poco.</p>";
    }

    const paragraphs = normalized
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => "<p>" + escapeHtml(p).replace(/\n/g, "<br />") + "</p>");

    return paragraphs.join("");
}

function extractTextFromModelContent(content) {
    if(typeof content === "string") {
        return content;
    }

    if(Array.isArray(content)) {
        return content
            .map((chunk) => {
                if(typeof chunk === "string") return chunk;
                if(chunk && typeof chunk.text === "string") return chunk.text;
                return "";
            })
            .join(" ")
            .trim();
    }

    return "";
}

export async function getCatalogContext(limit = 10) {
    const parsedLimit = Number.parseInt(limit);
    const safeLimit =
        Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50
            ? parsedLimit
            : 10;

    const sql = `
        SELECT
            p.id,
            p.name,
            p.slug,
            p.description,
            p.price,
            p.plastic_offset_kg,
            GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS categories
        FROM products p
        LEFT JOIN product_category pc ON pc.product_id = p.id
        LEFT JOIN categories c ON c.id = pc.category_id
        GROUP BY p.id, p.name, p.slug, p.description, p.price, p.plastic_offset_kg, p.create_date
        ORDER BY p.create_date DESC
        LIMIT ${safeLimit}
    `
       
    

    const [rows] = await connection.execute(sql);

    if(!rows.length) {
        return "Nessun prodotto disponibile in catalogo in questo momento";
    }

    const lines = rows.map((p, index) => {
        const price = Number(p.price).toFixed(2);
        const offset = Number(p.plastic_offset_kg).toFixed(2);
        const categories = p.categories || "Non categorizzato";
        const shortDescription = String(p.description || "").slice(0,140);
        return [
            index + 1 + ".",
            p.name,
            "(categories:",
            categories + ",",
            "(slug:",
            p.slug + ",",
            "prezzo:",
            price + "€" + ",",
            "plastic_offset_kg:",
            offset + ")",
            "-",
            shortDescription
        ].join(" ");
    });

    return ["Catalogo aggiornato:", ...lines].join("\n");
}

export async function callClaude(userMessage) {
    const catalogContext = await getCatalogContext(12);

    const finalSystemPrompt = [
        BASE_SYSTEM_PROMPT,
        "",
        "Contesto prodotti aggiornato dal database: ",
        catalogContext
    ].join("\n");

    const aiMessage = await agentModel.invoke([
        new SystemMessage(finalSystemPrompt),
        new HumanMessage(userMessage)
    ]);

    const rawText = extractTextFromModelContent(aiMessage.content);
    const answerHtml = toSafeHtmlFragment(rawText);

    return answerHtml;
}