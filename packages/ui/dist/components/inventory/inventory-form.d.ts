import { type DomainFrameProps } from '../../internal/domain.js';
import type { Inventory } from './types.js';
export interface InventoryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Inventory>;
    onSubmit: (value: Omit<Inventory, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function InventoryForm({ onSubmit, ...props }: InventoryFormProps): import("react").JSX.Element;
