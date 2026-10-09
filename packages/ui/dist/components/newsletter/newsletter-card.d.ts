import { type DomainFrameProps } from '../../internal/domain.js';
import type { Newsletter } from './types.js';
export interface NewsletterCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Newsletter;
}
export declare function NewsletterCard(props: NewsletterCardProps): import("react").JSX.Element;
