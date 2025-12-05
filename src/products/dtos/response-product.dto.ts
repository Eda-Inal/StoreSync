export class ResponseProductDto {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
}