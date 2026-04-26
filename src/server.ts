import express from 'express';
import { supplierRoutes } from './routes/suppliers';
import { hotelRoutes } from './routes/hotels';
import { healthRoutes } from './routes/health';

const app = express();
app.use(express.json());
app.use(supplierRoutes);
app.use(hotelRoutes);
app.use(healthRoutes);

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
