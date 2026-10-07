import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deployment } from './types.js';
export interface DeploymentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    onSelect?: (item: Deployment) => void;
    emptyMessage?: string;
}
export declare function DeploymentList({ onSelect, ...props }: DeploymentListProps): import("react").JSX.Element;
