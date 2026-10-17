import { type DomainFrameProps } from '../../internal/domain.js';
import type { Supplier } from './types.js';
export interface SupplierCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Supplier;
}
export declare function SupplierCard(props: SupplierCardProps): import("react").JSX.Element;
