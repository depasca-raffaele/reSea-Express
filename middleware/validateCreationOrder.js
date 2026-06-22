function normalizeOrderDate(value) {
    const raw = String(value).trim();

    if (!raw) {
        return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return `${raw} 00:00:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(raw)) {
        return raw.replace("T", " ");
    }

    return raw.replace("T", " ").slice(0, 19);
}

function validateCreationOrder(request, response, next) {
    const {
        email_client,
        shipping_address,
        billing_address,
        total_amount,
        order_date,
        client_name,
        phone_number
    } = request.body;

    const errors = [];

    //controllo campi obbligatori
    if (email_client == null) {
        errors.push({ field: "email_client", message: "Campo obbligatorio" });
    }
    if (shipping_address == null) {
        errors.push({ field: "shipping_address", message: "Campo obbligatorio" });
    }
    if (billing_address == null) {
        errors.push({ field: "billing_address", message: "Campo obbligatorio" });
    }
    if (total_amount == null) {
        errors.push({ field: "total_amount", message: "Campo obbligatorio" });
    }
    if (order_date == null) {
        errors.push({ field: "order_date", message: "Campo obbligatorio" });
    }
    if (client_name == null) {
        errors.push({ field: "client_name", message: "Campo obbligatorio" });
    }
    if (phone_number == null) {
        errors.push({ field: "phone_number", message: "Campo obbligatorio" });
    }

    // se mancano campi obbligatori, restituisce i vari errori
    if (errors.length > 0) {
        return response.status(400).json({
            error: "Campi obbligatori mancanti",
            errors: errors
        });
    }

    //controllo sui tipi di dato
    if (typeof email_client !== "string") {
        errors.push({ field: "email_client", message: "Deve essere una stringa" });
    }
    if (typeof shipping_address !== "string") {
        errors.push({ field: "shipping_address", message: "Deve essere una stringa" });
    }
    if (typeof billing_address !== "string") {
        errors.push({ field: "billing_address", message: "Deve essere una stringa" });
    }
    if (typeof client_name !== "string") {
        errors.push({ field: "client_name", message: "Deve essere una stringa" });
    }

    const email = email_client.trim();
    const shipping = shipping_address.trim();
    const billing = billing_address.trim();
    const name = client_name.trim();
    const phone = String(phone_number).trim();


    if (!email) {
        errors.push({ field: "email_client", message: "Non può essere vuoto" });
    }
    if (!shipping) {
        errors.push({ field: "shipping_address", message: "Non può essere vuoto" });
    }
    if (!billing) {
        errors.push({ field: "billing_address", message: "Non può essere vuoto" });
    }
    if (!name) {
        errors.push({ field: "client_name", message: "Non può essere vuoto" });
    }
    if (!phone) {
        errors.push({ field: "phone_number", message: "Non può essere vuoto" });
    }

    // Validazione email
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push({ field: "email_client", message: "Email non valida" });
        }
    }

    // Validazione indirizzi
    if (shipping && (shipping.length < 8 || shipping.length > 150)) {
        errors.push({ field: "shipping_address", message: "Deve essere tra 8 e 150 caratteri" });
    }
    if (billing && (billing.length < 8 || billing.length > 150)) {
        errors.push({ field: "billing_address", message: "Deve essere tra 8 e 150 caratteri" });
    }

    // Validazione nome
    if (name && (name.length < 2 || name.length > 100)) {
        errors.push({ field: "client_name", message: "Deve essere tra 2 e 100 caratteri" });
    }

    // Validazione importo
    const amount = Number(total_amount);
    if (Number.isNaN(amount) || amount <= 0) {
        errors.push({ field: "total_amount", message: "Deve essere un numero maggiore di zero" });
    }

    // Validazione telefono
    if (phone) {
        const phoneRegex = /^\d{7,15}$/;
        if (!phoneRegex.test(phone)) {
            errors.push({ field: "phone_number", message: "Deve contenere 7-15 cifre" });
        }
    }

    // Validazione data
    const normalizedOrderDate = normalizeOrderDate(order_date);
    if (!normalizedOrderDate) {
        errors.push({ field: "order_date", message: "Data non valida (formato: YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)" });
    }

    // Se ci sono errori, restituiscili tutti
    if (errors.length > 0) {
        return response.status(400).json({
            error: "Validazione fallita",
            errors: errors
        });
    }

    // Normalizzazione dei dati
    request.body.email_client = email;
    request.body.shipping_address = shipping;
    request.body.billing_address = billing;
    request.body.client_name = name;
    request.body.phone_number = phone;
    request.body.total_amount = amount;
    request.body.order_date = normalizedOrderDate;

    next();



}

export default validateCreationOrder;