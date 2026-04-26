import { Router } from 'express';
import {
  SUPPLIER_A_HOTELS,
  SUPPLIER_B_HOTELS,
  filterByCity,
} from '../data/mockSuppliers';

const router = Router();

router.get('/supplierA/hotels', (req, res) => {
  if (req.query.simulateDown === '1') {
    res.status(503).json({ error: 'Simulated supplier A outage' });
    return;
  }
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  if (!city.trim()) {
    res.status(400).json({ error: 'Missing required query: city' });
    return;
  }
  res.json(filterByCity(SUPPLIER_A_HOTELS, city));
});

router.get('/supplierB/hotels', (req, res) => {
  if (req.query.simulateDown === '1') {
    res.status(503).json({ error: 'Simulated supplier B outage' });
    return;
  }
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  if (!city.trim()) {
    res.status(400).json({ error: 'Missing required query: city' });
    return;
  }
  res.json(filterByCity(SUPPLIER_B_HOTELS, city));
});

export { router as supplierRoutes };
