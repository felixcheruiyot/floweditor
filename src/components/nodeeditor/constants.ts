export const DEFAULT_OPERAND = '@input';
export const GROUPS_OPERAND = '@contact.groups';
export const SUBFLOW_OPERAND = '@child.run.status';
export const WEBHOOK_OPERAND = '@run.webhook';

export const DEFAULT_BODY: string = `{
    "flow": @(json(run.flow)),
    "path": @(json(run.path)),
    "results": @(json(run.results)),
    "input": @(json(run.input)),
    "channel": @(json(run.input.channel))
    "contact": @(json(contact))
}`;
