import { GSM, OPTIONS, TOP_LEVEL_OPTIONS } from '~/components/form/textinput/constants';
import {
    cleanMsg,
    filterOptions,
    getOptionsList,
    getUnicodeChars,
    isUnicode,
    pluralize
} from '~/components/form/textinput/helpers';
import { FlowDefinition } from '~/flowTypes';
import { AssetType, CompletionOption, getCompletionName } from '~/store/flowContext';

const definition: FlowDefinition = require('~/test/assets/flows/a4f64f1b-85bc-477e-b706-de313a022979.json');

const optionQueryMap = OPTIONS.reduce((argMap, option: CompletionOption) => {
    const name = getCompletionName(option);

    const lastIndex = name.lastIndexOf('.');
    if (lastIndex > -1) {
        argMap[name.slice(0, lastIndex + 2)] = true;
        argMap[name.slice(0, lastIndex + 3)] = true;
        argMap[name] = true;
    } else {
        argMap[name.slice(0, 1)] = true;
        argMap[name.slice(0, 2)] = true;
        argMap[name] = true;
        argMap[`${name}.`] = true;
    }
    return argMap;
}, {});

const winkEmoji = '😉';

describe('helpers', () => {
    describe('isUnicode', () => {
        it('should return true if arg is Unicode, false otherwise', () => {
            expect(isUnicode(winkEmoji)).toBeTruthy();
            Object.keys(GSM).forEach(key => expect(isUnicode(key)).toBeFalsy());
        });
    });

    describe('getUnicodeChars', () => {
        it('should return an "empty" object if not passed a string containing Unicode chars', () => {
            expect(getUnicodeChars('abcd')).toEqual({});
        });

        it('should return a UnicodeCharMap if passed a string containing Unicode chars', () => {
            expect(getUnicodeChars(winkEmoji)).toEqual({ [winkEmoji]: true });
        });
    });

    describe('cleanMsg', () => {
        it('should replace specified unicode characters with their GSM counterparts', () =>
            expect(cleanMsg('“”‘’— …–')).toBe(`""''- ...-`));
    });

    describe('filterOptions', () => {
        it('should return top-level options if not passed a query', () =>
            expect(filterOptions(OPTIONS, '', false)).toEqual(TOP_LEVEL_OPTIONS));

        Object.keys(optionQueryMap).forEach(query =>
            it(`should filter options for "${query}"`, () =>
                expect(filterOptions(OPTIONS, query, true)).toMatchSnapshot())
        );
    });

    describe('pluralize', () => {
        it("should apply suffix to noun if count param isn't 1", () => {
            expect(pluralize(2, 'character')).toBe('characters');
        });

        it("shouldn't apply suffix to noun if count is 1", () => {
            expect(pluralize(1, 'character')).toBe('character');
        });
    });

    describe('getOptionsList', () => {
        it('should include only our predefined options if autocomplete arg is falsy', () => {
            expect(getOptionsList(false, {}).length).toBe(OPTIONS.length);
        });

        it('should include result names if autocomplete arg is truthy', () => {
            const optionsList = getOptionsList(true, {
                fields: {
                    type: AssetType.Field,
                    items: {
                        color: {
                            name: 'Color',
                            id: 'color',
                            type: AssetType.Field
                        }
                    }
                }
            });
            const expectedLength = OPTIONS.length + 5; // accounting for field and its properties

            expect(optionsList.length).toBe(expectedLength);
        });
    });
});
