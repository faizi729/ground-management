import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info(
    `[Request] ${req.method} ${req.url} | Body: ${JSON.stringify(req.body)} | Query: ${JSON.stringify(req.query)} | Params: ${JSON.stringify(req.params)}`
  );

  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    logger.info(`[Response] ${req.method} ${req.url} | Status: ${res.statusCode} | Body: ${body}`);
    return originalSend(body);
  };

  next();
};
