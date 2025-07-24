import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export const validate = <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: result.error.message,
      });
    }

    req.body = result.data;
    next();
};
