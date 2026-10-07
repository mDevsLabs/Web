import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workspace, WorkspaceMetric } from './types.js';
export interface WorkspaceOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workspace[];
    metrics: readonly WorkspaceMetric[];
}
export declare function WorkspaceOverview(props: WorkspaceOverviewProps): import("react").JSX.Element;
