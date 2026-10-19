import { type DomainFrameProps } from '../../internal/domain.js';
import type { Environment } from './types.js';
export interface EnvironmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Environment;
}
export declare function EnvironmentCard(props: EnvironmentCardProps): import("react").JSX.Element;
