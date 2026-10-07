import { type DomainFrameProps } from '../../internal/domain.js';
import type { Template } from './types.js';
export interface TemplateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Template[];
    onSelect?: (item: Template) => void;
    emptyMessage?: string;
}
export declare function TemplateList({ onSelect, ...props }: TemplateListProps): import("react").JSX.Element;
