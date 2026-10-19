import { type DomainFrameProps } from '../../internal/domain.js';
import type { Template } from './types.js';
export interface TemplateCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Template;
}
export declare function TemplateCard(props: TemplateCardProps): import("react").JSX.Element;
