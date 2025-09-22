import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
      userType?: string;
      isActive: boolean;
      phone: string | null;
      profileImageUrl: string | null;
      password: string | null;
      emailVerified: boolean | null;
      notificationPreferences: unknown;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}
declare module "bcrypt";
