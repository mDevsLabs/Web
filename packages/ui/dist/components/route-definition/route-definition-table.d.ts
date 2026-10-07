import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinition } from './types.js';
export interface RouteDefinitionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    emptyMessage?: string;
}
export declare function RouteDefinitionTable(props: RouteDefinitionTableProps): import("react").JSX.Element;
