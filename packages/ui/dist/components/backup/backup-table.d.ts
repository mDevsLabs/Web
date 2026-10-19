import { type DomainFrameProps } from '../../internal/domain.js';
import type { Backup } from './types.js';
export interface BackupTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Backup[];
    emptyMessage?: string;
}
export declare function BackupTable(props: BackupTableProps): import("react").JSX.Element;
