import { Router, type Request, type Response } from 'express';
import { supplierAHotels, supplierBHotels, getSupplierHotels } from '../data/mockSuppliers';
import { cityQuerySchema } from './validators';

const router = Router();

const handleSupplierRequest = (
  hotels: typeof supplierAHotels
) => (req: Request, res: Response): void => {
  const parsed = cityQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Invalid query',
      details: parsed.error.issues,
    });
    return;
  }

  const { city } = parsed.data;
  res.json(getSupplierHotels(hotels, city));
};

router.get('/supplierA/hotels', handleSupplierRequest(supplierAHotels));
router.get('/supplierB/hotels', handleSupplierRequest(supplierBHotels));

export default router;
