import connection from "../database/connection.js";
import { formatProduct } from "../utils/utils.js";


async function index(request, response) {
    try {
        const { search, category, minPrice, maxPrice, sortBy, limit } = request.query;
        const limit = request.validatedLimit || 12;
        const page = request.validatedPage || 1;
        const offset = (page - 1) * limit;

        let fromSql = `FROM products p`;

        const params = [];
        const conditions = ["1 = 1"];

        if (category) {
            querySql += `
                JOIN product_category pc ON p.id = pc.product_id
                JOIN categories c ON pc.category_id = c.id
            `;
            conditions.push("c.slug = ?");
            params.push(category);
        }

        if (search) {
            conditions.push("p.name LIKE ?");
            params.push(`%${search}%`);
        }
        if (minPrice !== undefined) {
            const parsedMinPrice = Number(minPrice);
            if (!Number.isNaN(parsedMinPrice)) {
                conditions.push("p.price >= ?");
                params.push(Number(parsedMinPrice));
            }
        }

        if (maxPrice !== undefined) {
            const parsedMaxPrice = Number(maxPrice);
            if (!Number.isNaN(parsedMaxPrice)) {
                conditions.push("p.price <= ?");
                params.push(Number(parsedMaxPrice));
            }
        }

        const whereSql = ` WHERE ${conditions.join(" AND ")}`;

        let orderSql = "ORDER BY p.id DESC";
        if (sortBy === "recent") {
            orderSql = "ORDER BY p.create_date DESC";
        } else if (sortBy === "price_asc") {
            orderSql = "ORDER BY p.price ASC";
        } else if (sortBy === "price_desc") {
            orderSql = "ORDER BY p.price DESC";
        }

        const countSql = `
            SELECT COUNT(DISTINCT p.id) AS total
            ${fromSql}
            ${whereSql}
        `;

        const [countRows] = await connection.execute(countSql, params);
        const total = countRows[0]?.total ?? 0;

        const totalPages = Math.max(1, Math.ceil(total / limit));

        const querySql = `
            SELECT DISTINCT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.price,
                p.create_date,
                p.plastic_offset_kg,
                p.image
            ${fromSql}
            ${whereSql}
            ${orderSql}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await connection.execute(querySql, [...params, limit, offset]);

        // per creare un percorso assoluto verso le immagini nel backend
        // request.protocol intercetta automaticamente "http" o "https" a seconda dalla chiamata che arriva al database
        // request.get('host') intercetta invece l'host che nel nostro caso è "localhost:3000" quindi alla fine ci ritroveremo con 
        // baseURL='http://localhost:3000'  
        const baseURL = `${request.protocol}://${request.get("host")}`;

        // Utilizzo .map() per creare un nuovo array per poter trasformare ogni singolo oggetto 'product' e lo passo alla funzione,
        // insieme alla base recuperata in precedenza, il resto lo troverete in utils\utils.js
        const productsFormatted = rows.map(product => formatProduct(product, baseURL));

        return response.status(200).json({
            error: null,
            data: productsFormatted,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });


    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante il recupero dei prodotti"
        })
    }
}

async function show(request, response) {
    try {
        const { slug } = request.params;
        const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

        if (!normalizedSlug) {
            return response.status(400).json({
                error: "Richiesta non valida",
                message: "Slug non valido"
            });
        }

        const productSql = `
            SELECT DISTINCT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.price,
                p.create_date,
                p.plastic_offset_kg,
                p.image
            FROM products p
            WHERE p.slug = ?
            LIMIT 1
        `;

        const [rows] = await connection.execute(productSql, [normalizedSlug]);

        if (rows.length === 0) {
            return response.status(404).json({
                error: "Risorsa non trovata",
                message: "Prodotto non trovato"
            });
        }

        const baseUrl = `${request.protocol}://${request.get("host")}`;
        const product = formatProduct(rows[0], baseUrl);

        const categoriesSql = `
            SELECT
                c.id,
                c.name,
                c.slug,
                c.little_description
            FROM categories c
            JOIN product_category pc ON c.id = pc.category_id
            WHERE pc.product_id = ?
            ORDER BY c.name ASC
        `;

        const [categories] = await connection.execute(categoriesSql, [rows[0].id]);

        product.categories = categories;

        return response.status(200).json({
            error: null,
            data: product
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante il recupero dei prodotti"
        })
    }

}

async function getBestSellers(request, response) {
    try {

        const limit = request.validatedLimit || 4;

        const querySql = `
            SELECT 
                p.id, 
                p.name, 
                p.slug, 
                p.price, 
                p.image,
                SUM(op.quantity) AS total_sold
            FROM products p
            JOIN order_product op 
                ON p.id = op.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT ?
        `;

        const [rows] = await connection.query(querySql, [limit]);

        if (rows.length === 0) {
            return response.status(200).json({
                error: null,
                data: [],
                message: "Nessun prodotto venduto al momento."
            });
        }

        const baseUrl = `${request.protocol}://${request.get("host")}`;
        const productsFormatted = rows.map(product => formatProduct(product, baseUrl));

        return response.status(200).json({
            error: null,
            data: productsFormatted
        });
    } catch (error) {

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante il recupero dei best seller"
        });
    }
}

export { index, show, getBestSellers };