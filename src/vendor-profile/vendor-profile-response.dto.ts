export class VendorProfileResponseDto {
    id: string;
    userId: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    createdAt: Date;
    updatedAt: Date;
}
