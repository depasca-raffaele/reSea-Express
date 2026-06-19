import express from "express";

import { index, show, create, modify, destroy } from '../controllers/sampleController.js';

const productRouter = express.Router();

productRouter.get('/', index);

productRouter.get('/:slug', show);

export default productRouter;
