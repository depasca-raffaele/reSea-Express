function validateProductsQuery(request, response, next) {
    const { search, category, minPrice, maxPrice, limit, sortBy } = request.query;
    const allowedSort = ["recent", "price_asc", "price_desc"];
    const allowedParams = ["search", "category", "minPrice", "maxPrice", "limit", "sortBy"];

    //whitelist query params
    const unknownParams = Object.keys(request.query).filter(
        (key) => !allowedParams.includes(key)
    );

    if (unknownParams.length > 0) {
        return response.status(400).json({
            error: "Richiesta non valida",
            message: "Paramentri di query non supportati",
            details: {
                unknown: unknownParams,
                allowed: allowedParams
            }
        });
    }


    //validazione dei valori
    if (sortBy !== undefined && !allowedSort.includes(sortBy)) {
        return response.status(400).json({
            error: "Richiesta non valida",
            message: "sortBy non valido. Valori ammessi: recent, price_asc, price_desc"
        });
    }

    if (search !== undefined) {
        if (typeof search !== "string" || search.trim().length === 0 || search.trim().length > 100) {
            return response.status(400).json({
                error: "Input non valido",
                message: "search deve essere una stringa tra 1 e 100 caratteri."
            });
        }
    }

    if (category !== undefined) {
        if (typeof category !== "string" || category.trim().length === 0 || category.trim().length > 100) {
            return response.status(400).json({
                error: "Input non valido",
                message: "category deve essere una stringa tra 1 e 100 caratteri."
            });
        }
    }

    if (minPrice !== undefined) {
        const parsedMin = Number(minPrice);
        if (Number.isNaN(parsedMin) || parsedMin < 0) {
            return response.status(400).json({
                error: "Richiesta non valida",
                message: "minPrice deve essere un numero maggiore o uguale a 0"
            });
        }
    }

    if (maxPrice !== undefined) {
        const parsedMax = Number(maxPrice);
        if (Number.isNaN(parsedMax) || parsedMax < 0) {
            return response.status(400).json({
                error: "Richiesta non valida",
                message: "maxPrice deve essere un numero maggiore o uguale a 0"
            });
        }
    }

    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
        return response.status(400).json({
            error: "Richiesta non valida",
            message: "minPrice non può essere maggiore di maxPrice"
        });
    }

    if (limit !== undefined) {
        const parsedLimit = Number(limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            return response.status(400).json({
                error: "Richiesta non valida",
                message: "limit deve essere un intero tra 1 e 100"
            });
        }
        request.validatedLimit = parsedLimit;
    }

    next();
}

export default validateProductsQuery;