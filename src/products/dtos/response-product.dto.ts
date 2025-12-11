export class VendorProductDetailDto {
    id: string;
    name: string;
    description: string;
    productType: string;
    basePrice: number;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;

    totalStock: number;
    minPrice: number;
    maxPrice: number;

    variants: {
        id: string;
        name: string;
        value: string;
        stock: number;
        price: number | null;
        sku: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[];
}
