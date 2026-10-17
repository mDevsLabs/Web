import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucket } from './types.js';
export interface StorageBucketFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<StorageBucket>;
    onSubmit: (value: Omit<StorageBucket, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function StorageBucketForm({ onSubmit, ...props }: StorageBucketFormProps): import("react").JSX.Element;
