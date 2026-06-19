import express from "express";

import { index, show, create, modify, destroy } from '../controllers/sampleController.js';

const orderRouter = express.Router();

orderRouter.get('/', index);

orderRouter.get('/:slug', show);

orderRouter.post('/', create)

export default orderRouter;
