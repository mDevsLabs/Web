import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinition } from './types.js';
export interface RouteDefinitionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    onSelect?: (item: RouteDefinition) => void;
    emptyMessage?: string;
}
export declare function RouteDefinitionList({ onSelect, ...props }: RouteDefinitionListProps): import("react").JSX.Element;
