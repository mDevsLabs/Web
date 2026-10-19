import { type DomainFrameProps } from '../../internal/domain.js';
import type { Backup } from './types.js';
export interface BackupFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Backup>;
    onSubmit: (value: Omit<Backup, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BackupForm({ onSubmit, ...props }: BackupFormProps): import("react").JSX.Element;
