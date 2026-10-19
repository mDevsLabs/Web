import { type DomainFrameProps } from '../../internal/domain.js';
import type { Release } from './types.js';
export interface ReleaseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Release>;
    onSubmit: (value: Omit<Release, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ReleaseForm({ onSubmit, ...props }: ReleaseFormProps): import("react").JSX.Element;
