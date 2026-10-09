import { type ReactNode, type HTMLAttributes } from 'react';
export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
    brand: ReactNode;
    navigation?: ReactNode;
    actions?: ReactNode;
}
export declare function AppHeader({ brand, navigation, actions, children, className, ...props }: AppHeaderProps): import("react").JSX.Element;
