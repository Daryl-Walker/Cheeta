export interface UserIdentity {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      identity?: UserIdentity;
    }
  }
}
