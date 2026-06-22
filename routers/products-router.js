import express from "express";
import validateProductsQuery from "../middleware/validateProductsQuery.js";
import validateSlug from "../middleware/validateSlug.js";
import validateCategoryFilter from "../middleware/validateCategoryFilter.js";

import { index, show } from '../controllers/products.js';

const productRouter = express.Router();

productRouter.get('/', validateProductsQuery, validateCategoryFilter, index);

productRouter.get('/:slug', validateSlug, show);

export default productRouter;
