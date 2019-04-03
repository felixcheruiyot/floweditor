import { HIDDEN, Operator, OperatorMap, Operators, TEXT_TYPES } from '~/config/interfaces';

const ARGUMENT_ATTACHMENTS = '@input.attachments';

export const operatorConfigList: Operator[] = [
    {
        type: Operators.has_any_word,
        verboseName: 'has any of the words',
        additionalArguments: 1,
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_all_words,
        verboseName: 'has all of the words',
        additionalArguments: 1,
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_phrase,
        verboseName: 'has the phrase',
        additionalArguments: 1,
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_only_phrase,
        verboseName: 'has only the phrase',
        additionalArguments: 1,
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_beginning,
        verboseName: 'starts with',
        additionalArguments: 1
    },
    {
        type: Operators.has_text,
        verboseName: 'has some text',
        additionalArguments: 0,
        categoryName: 'Has Text',
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_number,
        verboseName: 'has a number',
        additionalArguments: 0,

        categoryName: 'Has Number'
    },
    {
        type: Operators.has_number_between,
        verboseName: 'has a number between',
        additionalArguments: 2
    },
    {
        type: Operators.has_number_lt,
        verboseName: 'has a number below',
        additionalArguments: 1
    },
    {
        type: Operators.has_number_lte,
        verboseName: 'has a number at or below',
        additionalArguments: 1
    },
    {
        type: Operators.has_number_eq,
        verboseName: 'has a number equal to',
        additionalArguments: 1
    },
    {
        type: Operators.has_number_gte,
        verboseName: 'has a number at or above',
        additionalArguments: 1
    },
    {
        type: Operators.has_number_gt,
        verboseName: 'has a number above',
        additionalArguments: 1
    },
    {
        type: Operators.has_date,
        verboseName: 'has a date',
        additionalArguments: 0,

        categoryName: 'Has Date',
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_date_lt,
        verboseName: 'has a date before',
        additionalArguments: 1,

        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_date_eq,
        verboseName: 'has a date equal to',
        additionalArguments: 1,

        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_date_gt,
        verboseName: 'has a date after',
        additionalArguments: 1,

        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_run_status,
        verboseName: 'has a run status of',
        additionalArguments: 1,
        visibility: HIDDEN
    },
    {
        type: Operators.has_group,
        verboseName: 'is in the group',
        additionalArguments: 1,
        visibility: HIDDEN
    },
    {
        type: Operators.has_phone,
        verboseName: 'has a phone number',
        additionalArguments: 0,
        categoryName: 'Has Phone'
    },
    {
        type: Operators.has_email,
        verboseName: 'has an email',
        additionalArguments: 0,
        categoryName: 'Has Email',
        visibility: TEXT_TYPES
    },
    {
        type: Operators.has_error,
        verboseName: 'has an error',
        additionalArguments: 0,
        categoryName: 'Has Error',
        visibility: HIDDEN
    },
    {
        type: Operators.has_value,
        verboseName: 'is not empty',
        additionalArguments: 0,
        categoryName: 'Not Empty'
    },
    {
        type: Operators.has_attachment,
        verboseName: 'has an attachment',
        additionalArguments: 0,
        initialArgument: ARGUMENT_ATTACHMENTS,
        categoryName: 'Has Attachment'
    },
    {
        type: Operators.has_wait_timed_out,
        verboseName: null,
        additionalArguments: 0,
        visibility: HIDDEN
    },
    {
        type: Operators.has_pattern,
        verboseName: 'matches regex',
        additionalArguments: 1
    }
];

export const operatorConfigMap: OperatorMap = operatorConfigList.reduce(
    (map: OperatorMap, operatorConfig: Operator) => {
        map[operatorConfig.type] = operatorConfig;
        return map;
    },
    {}
);

/**
 * Shortcut for constant lookup of operator config in operator configs map
 * @param {string} type - The type of the operator config to return, e.g. 'send_msg'
 * @returns {Object} - The operator config found at operatorConfigs[type] or -1
 */
export const getOperatorConfig = (type: Operators): Operator => operatorConfigMap[type];
