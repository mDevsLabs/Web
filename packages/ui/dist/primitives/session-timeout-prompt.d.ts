export interface SessionTimeoutPromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    secondsRemaining: number;
    onContinue: () => void;
    onSignOut: () => void;
    pending?: boolean;
    onReturnFocus?: () => void;
}
export declare function SessionTimeoutPrompt({ open, onOpenChange, secondsRemaining, onContinue, onSignOut, pending, onReturnFocus }: SessionTimeoutPromptProps): import("react").JSX.Element;
