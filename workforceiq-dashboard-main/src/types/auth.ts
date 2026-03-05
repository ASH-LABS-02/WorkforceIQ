export type UserRole = 'admin' | 'manager' | 'hr' | 'recruiter' | 'user';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}
