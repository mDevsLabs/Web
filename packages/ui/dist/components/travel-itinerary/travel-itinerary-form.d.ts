import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerary } from './types.js';
export interface TravelItineraryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TravelItinerary>;
    onSubmit: (value: Omit<TravelItinerary, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TravelItineraryForm({ onSubmit, ...props }: TravelItineraryFormProps): import("react").JSX.Element;
