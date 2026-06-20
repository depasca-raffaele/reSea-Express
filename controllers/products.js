import connection from "../database/connection.js";
import { formatProduct } from "../utils/utils.js";


async function index(request, response) {
    try {
        const querySql = `
            SELECT
                id,
                name,
                slug,
                description,
                price,
                create_date,
                plastic_offset_kg,
                image
            FROM products
            ORDER BY id DESC
        `;

        const [rows] = await connection.execute(querySql);

        // per creare un percorso assoluto verso le immagini nel backend
        // request.protocol intercetta automaticamente "http" o "https" a seconda dalla chiamata che arriva al database
        // request.get('host') intercetta invece l'host che nel nostro caso è "localhost:3000" quindi alla fine ci ritroveremo con 
        // baseURL='http://localhost:3000'    
        const baseUrl = `${request.protocol}://${request.get('host')}`;

        // Utilizzo .map() per creare un nuovo array per poter trasformare ogni singolo oggetto 'product' e lo passo alla funzione,
        // insieme alla base recuperata in precedenza, il resto lo troverete in utils\utils.js
        const productsFormatted = rows.map(product => formatProduct(product, baseUrl));

        return response.status(200).json({
            error: null,
            data: productsFormatted
        })

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal Server Error",
            message: "Errore durante il recupero dei prodotti"
        })
    }
}

async function show(request, response) {
    try {
        const { slug } = request.params;
        const normalizedSlug = String(slug || "").trim().toLocaleLowerCase();

        if (!normalizedSlug) {
            return response.status(400).json({
                error: "Bad Request",
                message: "Slug non valido"
            });
        }

        const querySql = `
            SELECT
                id,
                name,
                slug,
                description,
                price,
                create_date,
                plastic_offset_kg,
                image
            FROM products
            WHERE slug = ?
            LIMIT 1
        `;

        const [rows] = await connection.execute(querySql, [normalizedSlug]);

        if (rows.length === 0) {
            return response.status(404).json({
                error: "Not Found",
                message: "Prodotto non trovato"
            });
        }

        //stessa cosa di prima, solo che qui alla funzione passo rows[0] che è il primo elemento dell'array
        const baseUrl = `${request.protocol}://${request.get('host')}`;
        const productFormatted = formatProduct(rows[0], baseUrl);

        return response.status(200).json({
            error: null,
            data: productFormatted
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal Server Error",
            message: "Errore durante il recupero dei prodotti"
        })
    }

}

export { index, show };