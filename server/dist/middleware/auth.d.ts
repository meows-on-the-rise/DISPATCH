import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        userId: string;
    };
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireVerifiedDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map