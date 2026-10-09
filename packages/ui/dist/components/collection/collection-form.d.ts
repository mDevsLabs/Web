import { type DomainFrameProps } from '../../internal/domain.js';
import type { Collection } from './types.js';
export interface CollectionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Collection>;
    onSubmit: (value: Omit<Collection, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CollectionForm({ onSubmit, ...props }: CollectionFormProps): import("react").JSX.Element;
