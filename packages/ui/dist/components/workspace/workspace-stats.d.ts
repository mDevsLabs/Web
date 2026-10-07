import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkspaceMetric } from './types.js';
export interface WorkspaceStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WorkspaceMetric[];
}
export declare function WorkspaceStats(props: WorkspaceStatsProps): import("react").JSX.Element;
