import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinition } from './types.js';
export interface RouteDefinitionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: RouteDefinition;
}
export declare function RouteDefinitionCard(props: RouteDefinitionCardProps): import("react").JSX.Element;
