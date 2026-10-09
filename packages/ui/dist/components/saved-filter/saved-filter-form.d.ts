import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilter } from './types.js';
export interface SavedFilterFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SavedFilter>;
    onSubmit: (value: Omit<SavedFilter, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SavedFilterForm({ onSubmit, ...props }: SavedFilterFormProps): import("react").JSX.Element;
