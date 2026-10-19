import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenu } from './types.js';
export interface RestaurantMenuFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<RestaurantMenu>;
    onSubmit: (value: Omit<RestaurantMenu, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function RestaurantMenuForm({ onSubmit, ...props }: RestaurantMenuFormProps): import("react").JSX.Element;
