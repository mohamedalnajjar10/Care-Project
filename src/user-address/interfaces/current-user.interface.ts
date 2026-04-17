export interface CurrentUser {
    id?: string;
    sub: string;
    role: string;
    mobile?: string | null;
}