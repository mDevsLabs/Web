import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoom } from './types.js';
export interface HotelRoomFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<HotelRoom>;
    onSubmit: (value: Omit<HotelRoom, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function HotelRoomForm({ onSubmit, ...props }: HotelRoomFormProps): import("react").JSX.Element;
