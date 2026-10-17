import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deployment } from './types.js';
export interface DeploymentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    emptyMessage?: string;
}
export declare function DeploymentTable(props: DeploymentTableProps): import("react").JSX.Element;
