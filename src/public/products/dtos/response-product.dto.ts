export class PublicProductDetailDto {
    id: string;
    name: string;
    description: string;

    minPrice: number;
    maxPrice: number;

    inStock: boolean;

    category: {
        id: string;
        name: string;
    } | null;

    images: string[];

    variants?: PublicVariantDto[];
}
