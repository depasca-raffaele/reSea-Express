import express from 'express';
import orderRouter from './routers/orders-router.js';
import productRouter from './routers/products-router.js';

const app = express();

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

app.use(express.json());
app.use(express.static('public'));

app.use('/orders', orderRouter);

app.use('/products', productRouter)

app.use((request, response, next) => {

    response.status(404).json({
        error: "Resource not found",
        message: "The requested endpoint does not exist on the server"
    });
});

app.listen(port, (error) => {
    if (error) {
        console.error('Error starting server:', error);
    } else {
        console.log(`Server is running on http://${host}:${port}`);
    }
});
