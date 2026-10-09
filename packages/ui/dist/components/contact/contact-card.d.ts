import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contact } from './types.js';
export interface ContactCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Contact;
}
export declare function ContactCard(props: ContactCardProps): import("react").JSX.Element;
