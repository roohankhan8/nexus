export interface AuthUser {
  userId: string;
  email: string;
}

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}
