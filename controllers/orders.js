import connection from "../database/connection.js";
import { sendMail, generateEmailHtml } from "../services/emailService.js";

async function index(request, response) {
    try {
        const querySql = `
            SELECT
                id,
                email_client,
                shipping_address,
                billing_address, 
                total_amount, 
                order_date, 
                client_name, 
                phone_number
            FROM orders
            ORDER BY id DESC
        `;

        const [rows] = await connection.execute(querySql);

        return response.status(200).json({
            error: null,
            data: rows
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante il recupero degli ordini"
        });
    }
}

async function show(request, response) {
    try {
        const orderId = request.orderId

        const querySql = `
        SELECT 
            o.id, 
            o.email_client, 
            o.total_amount, 
            o.order_date, 
            o.client_name,
            p.name AS product_name, op.quantity, op.price
        FROM orders o
        JOIN order_product op ON o.id = op.order_id
        JOIN products p ON op.product_id = p.id
        WHERE o.id = ?
        `;

        const [rows] = await connection.execute(querySql, [orderId]);

        if (rows.length === 0) {
            return response.status(404).json({
                error: "Risorsa non trovata",
                message: "Ordine non trovato"
            });
        }

        const orderData = {
            id: rows[0].id,
            email: rows[0].email_client,
            total: rows[0].total_amount,
            date: rows[0].order_date,
            client: rows[0].client_name,

            items: rows.map(row => ({
                product_name: row.product_name,
                quantity: row.quantity,
                price: row.price
            }))
        };

        return response.status(200).json({
            error: null,
            data: orderData
        });

    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Errore interno del server",
            message: "Errore durante il recupero dell'ordine"
        });
    }
}

async function create(request, response) {

    try {
        const {
            email_client,
            shipping_address,
            billing_address,
            client_name,
            phone_number,
            items
        } = request.body;


        const placeholders = items.map(() => '?').join(',');


        const productIds = items.map(item => item.id);


        const [products] = await connection.execute(
            `SELECT id, plastic_offset_kg, price FROM products WHERE id IN (${placeholders})`,
            productIds
        );

        await connection.beginTransaction();

        const productMap = products.reduce((accumulator, p) => {
            accumulator[p.id] = { price: p.price, plastic: p.plastic_offset_kg };
            return accumulator;
        }, {});

        let totalAmount = 0;
        let totalPlastic = 0;
        const processedItems = [];

        for (const item of items) {
            const productInfo = productMap[item.id];

            if (!item.quantity || item.quantity < 1) {
                throw new Error(`Quantità non valida per il prodotto ${item.id}`);
            }

            if (!productInfo) {
                throw new Error(`Prodotto ID ${item.id} non trovato`);
            }

            totalAmount += productInfo.price * item.quantity;
            totalPlastic += productInfo.plastic * item.quantity;

            processedItems.push({ ...item, unitPrice: productInfo.price });
        }

        const IVA_RATE = 0.22; // 22%
        const totalIVA = totalAmount * IVA_RATE;
        const totalWithIVA = totalAmount + totalIVA;

        const querySql = `
            INSERT INTO orders (email_client, shipping_address, billing_address, total_amount, order_date, client_name, phone_number)
            VALUES (?, ?, ?, ?, NOW(), ?, ?)
        `;

        const [result] = await connection.execute(querySql, [
            email_client,
            shipping_address,
            billing_address,
            totalWithIVA,
            client_name,
            phone_number
        ]);

        const orderId = result.insertId;

        for (const item of processedItems) {
            await connection.execute(
                "INSERT INTO order_product (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.id, item.quantity, item.unitPrice]
            );
        }

        await connection.commit();

        const emailData = {
            client_name: client_name,
            orderId: orderId,
            totalAmount: totalWithIVA.toFixed(2),
            totalPlastic: totalPlastic.toFixed(2)
        };

        try {
            const emailBody = await generateEmailHtml('orderConfirmation', emailData);
            await sendMail({
                to: email_client,
                subject: `Conferma ordine reSea #${orderId}`,
                body: emailBody
            });

            const adminEmailData = {
                ...emailData,
                shipping_address,
                phone_number,
                items: processedItems
            };

            const adminEmailBody = await generateEmailHtml('adminNotification', adminEmailData);

            const adminEmail = process.env.ADMIN_EMAIL;

            await sendMail({
                to: adminEmail,
                subject: `🔔 NUOVO ORDINE: #ORD-2026-${orderId}`,
                body: adminEmailBody
            });

        } catch (emailError) {

            console.error("Errore nell'invio delle email:", emailError);
        }

        return response.status(201).json({
            message: "Ordine creato con successo",
            data: {
                id: orderId,
                total: totalWithIVA,
                total_plastic: totalPlastic,
                items: processedItems
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);

        if (error.message.includes("non trovato") || error.message.includes("non valida")) {
            return response.status(400).json({ message: error.message });
        }

        return response.status(500).json({ error: "Errore interno del server" });
    }
}

export { index, show, create };