export type CodeActionEvent = {
    type: "add_cell";
    content: string;
};
export type ControlEvent = {
    type: "toggle_theme";
};
export type ManagedEvent = MessageEvent<CodeActionEvent | ControlEvent>;
