import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shipment } from './types.js';
export interface ShipmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Shipment>;
    onSubmit: (value: Omit<Shipment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ShipmentForm({ onSubmit, ...props }: ShipmentFormProps): import("react").JSX.Element;
