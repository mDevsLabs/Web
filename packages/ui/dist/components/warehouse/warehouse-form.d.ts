import { type DomainFrameProps } from '../../internal/domain.js';
import type { Warehouse } from './types.js';
export interface WarehouseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Warehouse>;
    onSubmit: (value: Omit<Warehouse, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function WarehouseForm({ onSubmit, ...props }: WarehouseFormProps): import("react").JSX.Element;
