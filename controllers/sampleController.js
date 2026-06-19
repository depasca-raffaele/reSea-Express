import connection from "../database/connection.js";

async function index(request, response) {
    try {
        const { } = request.query;

        const querySql = ``;

        const [] = await connection.execute(querySql, []);

        return response.status(200).json({
            error: null,
            data: risultati
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: 'Internal Server Error',
            message: 'Errore durante il recupero dei prodotti',
        });
    }
};

async function show(request, response) {
    try {
        const { } = request.params;

        const querySql = ``;

        const [] = await connection.execute(querySql, []);

        return response.status(200).json({
            error: null,
            data: risultati
        })

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: 'Internal Server Error',
            message: 'Errore durante il recupero dei prodotti',
        });
    }
}

async function create(request, response) {
    try {
        const { } = request.body;

        const querySql = ``;

        const [] = await connection.execute(querySql, []);

        return response.status(201).json({
            error: null,
            message: 'Creato con successo',
            data: { id: risultato.insertId }
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: 'Internal Server Error',
            message: 'Errore durante la creazione'

        });
    }
};

async function modify(request, response) {
    try {
        const { } = request.params; // per l'id
        const { } = request.body;   // corpo modifica

        const query = ``;

        const [] = await connection.execute(query, []);

        return response.status(200).json({
            error: null,
            message: 'Modificato con successo',
            data: { id: parseInt(id) }
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: 'Internal Server Error',
            message: 'Errore durante la modifica',
        });
    }
};

async function destroy(request, response) {
    try {
        const { } = request.params;

        const querySql = ``;

        const [] = await connection.execute(querySql);

        return response.status(200).json({
            error: null,
            message: 'Eliminato con successo',
            data: { id: parseInt(id) }
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: 'Internal Server Error',
            message: 'Errore durante l\'eliminazione',
        });
    }
}

export { index, show, create, modify, destroy };