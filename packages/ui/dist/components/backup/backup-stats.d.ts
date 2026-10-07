import { type DomainFrameProps } from '../../internal/domain.js';
import type { BackupMetric } from './types.js';
export interface BackupStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BackupMetric[];
}
export declare function BackupStats(props: BackupStatsProps): import("react").JSX.Element;
