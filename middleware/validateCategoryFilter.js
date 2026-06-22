import { response } from "express";
import connection from "../database/connection";

async function validateCategoryFilter(request, params, next) {
    try {
        const { category } = request.query;

        //se non c'è un filtro si procede normalmente
        if (!category) {
            return next();
        }

        //verica sulla categoria
        const querySql = `
            SELECT id FROM categories WHERE slug = ? LIMIT 1
        `;
        const [rows] = await connection.execute(querySql, [category]);

        if (rows.length === 0) {
            return response.status(404).json({
                error: "Risorsa non trovata",
                message: "Categoria non trovata"
            });
        }
        //categoria valida si procede
        next();

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante la validazione della categoria"
        });
    }

}

export default validateCategoryFilter;