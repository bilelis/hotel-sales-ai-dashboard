import { Router } from 'express';
import { getTablesMetadata, getTableData } from '../controllers/tables.controller.js';

export const tablesRouter = Router();

tablesRouter.get('/tables', getTablesMetadata);
tablesRouter.get('/tables/:tableName', getTableData);
