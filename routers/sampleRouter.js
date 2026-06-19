import express from "express";

import { index, show, create, modify, destroy } from '../controllers/sampleController.js';

const sampleRouter = express.Router();

// INDEX http://localhost:3000/sample
sampleRouter.get('/', index);

// SHOW http://localhost:5555/sample/:id
sampleRouter.get('/:id', show);

// CREATE http://localhost:5555/sample
sampleRouter.post('/', create)

// PATCH http://localhost:5555/sample/:id
sampleRouter.patch('/:id', modify)

// DELETE http://localhost:5555/sample/:id
sampleRouter.delete('/:id', destroy)

export default sampleRouter;
