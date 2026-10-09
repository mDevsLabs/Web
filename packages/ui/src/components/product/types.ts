import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Product = {
    id?: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    status: "draft" | "active" | "archived";
};
export type ProductStatus = Product['status'];
export interface ProductActivity extends DomainActivity {
    productId?: string;
}
export type ProductMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalProduct' | 'activeProduct' | 'valueProduct';
};
export type ProductSettingsValues = Partial<Record<"notifyProduct" | "archiveProduct" | "approveProduct", boolean>>;
