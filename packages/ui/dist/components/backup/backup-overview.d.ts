import { type DomainFrameProps } from '../../internal/domain.js';
import type { Backup, BackupMetric } from './types.js';
export interface BackupOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Backup[];
    metrics: readonly BackupMetric[];
}
export declare function BackupOverview(props: BackupOverviewProps): import("react").JSX.Element;
