import { type DomainFrameProps } from '../../internal/domain.js';
import type { Integration } from './types.js';
export interface IntegrationCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Integration;
}
export declare function IntegrationCard(props: IntegrationCardProps): import("react").JSX.Element;
