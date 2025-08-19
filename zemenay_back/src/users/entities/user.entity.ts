export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author',
  EDITOR = 'editor',
  USER = 'user',
  GUEST = 'guest',
}

export class User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  avatar_url?: string;
  bio?: string;
  website?: string;
  twitter_handle?: string;
  facebook_url?: string;
  instagram_handle?: string;
  linkedin_url?: string;
  github_username?: string;
  email_verified: boolean;
  email_verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: string;
}
