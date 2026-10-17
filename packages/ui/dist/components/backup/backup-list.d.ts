import { type DomainFrameProps } from '../../internal/domain.js';
import type { Backup } from './types.js';
export interface BackupListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Backup[];
    onSelect?: (item: Backup) => void;
    emptyMessage?: string;
}
export declare function BackupList({ onSelect, ...props }: BackupListProps): import("react").JSX.Element;
