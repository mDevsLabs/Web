import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deployment } from './types.js';
export interface DeploymentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Deployment;
}
export declare function DeploymentCard(props: DeploymentCardProps): import("react").JSX.Element;
