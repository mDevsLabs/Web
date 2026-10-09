import { type DomainFrameProps } from '../../internal/domain.js';
import type { FolderMetric } from './types.js';
export interface FolderStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FolderMetric[];
}
export declare function FolderStats(props: FolderStatsProps): import("react").JSX.Element;
