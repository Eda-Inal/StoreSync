export class ResponseProductDto {
    id: string;
    name: string;
    description: string;
    price: number;

    inStock: boolean;
    lowStock?: boolean;

    category: {
        id: string;
        name: string;
    } | null;

    images: string[];  //urls
    variants?: {
        id: string;
        name: string;   // color
        value: string;  // red
        inStock: boolean;
    }[];
}
