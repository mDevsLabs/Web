import { type DomainFrameProps } from '../../internal/domain.js';
import type { Backup } from './types.js';
export interface BackupCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Backup;
}
export declare function BackupCard(props: BackupCardProps): import("react").JSX.Element;
