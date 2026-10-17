import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrder } from './types.js';
export interface PurchaseOrderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<PurchaseOrder>;
    onSubmit: (value: Omit<PurchaseOrder, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PurchaseOrderForm({ onSubmit, ...props }: PurchaseOrderFormProps): import("react").JSX.Element;
