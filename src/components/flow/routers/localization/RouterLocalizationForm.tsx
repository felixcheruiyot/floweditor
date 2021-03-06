import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import Dialog, { ButtonSet, HeaderStyle, Tab } from '~/components/dialog/Dialog';
import { determineTypeConfig } from '~/components/flow/helpers';
import { LocalizationFormProps } from '~/components/flow/props';
import {
    getLocalizedObjects,
    LocalizedType,
    getOriginalCase,
    getOriginalCategory
} from '~/components/flow/routers/localization/helpers';
import * as styles from '~/components/flow/routers/localization/RouterLocalizationForm.scss';
import TextInputElement from '~/components/form/textinput/TextInputElement';
import { getOperatorConfig } from '~/config/operatorConfigs';
import { Case, Category } from '~/flowTypes';
import { FormState, mergeForm } from '~/store/nodeEditor';

export interface RouterLocalizationFormState extends FormState {
    categories: Category[];
    cases: Case[];
}

export default class RouterLocalizationForm extends React.Component<
    LocalizationFormProps,
    RouterLocalizationFormState
> {
    constructor(props: LocalizationFormProps) {
        super(props);

        const categories: Category[] = getLocalizedObjects(
            props.nodeSettings,
            LocalizedType.Category
        ) as Category[];
        const cases: Case[] = getLocalizedObjects(props.nodeSettings, LocalizedType.Case) as Case[];

        this.state = { categories, cases, valid: true };

        bindCallbacks(this, {
            include: [/^handle/]
        });
    }

    private handleUpdate(keys: { category?: Category; kase?: Case }): boolean {
        const updates: Partial<RouterLocalizationFormState> = {};

        if (keys.hasOwnProperty('category')) {
            updates.categories = [keys.category];
        }

        if (keys.hasOwnProperty('kase')) {
            updates.cases = [keys.kase];
        }

        const updated = mergeForm(this.state, updates);
        this.setState(updated);
        return updated.valid;
    }

    private handleUpdateCategoryName(category: Category, name: string): boolean {
        category.name = name;
        return this.handleUpdate({ category });
    }

    private handleUpdateCaseArgument(kase: Case, arg: string): boolean {
        kase.arguments = [arg];
        return this.handleUpdate({ kase });
    }

    private handleSave(): void {
        // collect up our category localizations
        const translations: any[] = this.state.categories.map((cat: Category) => {
            return cat.name
                ? {
                      uuid: cat.uuid,
                      translations: {
                          name: cat.name
                      }
                  }
                : { uuid: cat.uuid };
        });

        // same thing for any cases
        translations.push(
            ...this.state.cases.map((kase: Case) => {
                return kase.arguments
                    ? {
                          uuid: kase.uuid,
                          translations: {
                              arguments: kase.arguments
                          }
                      }
                    : { uuid: kase.uuid };
            })
        );

        this.props.updateLocalizations(this.props.language.id, translations);

        // notify our modal we are done
        this.props.onClose(false);
    }

    private getButtons(): ButtonSet {
        return {
            primary: { name: 'Ok', onClick: this.handleSave },
            secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
        };
    }

    public renderCases(): JSX.Element[] {
        return this.state.cases.map((kase: Case) => {
            const originalCase = getOriginalCase(this.props.nodeSettings, kase.uuid) as Case;

            const { verboseName } = getOperatorConfig(originalCase.type);

            const [orginalArgument] = originalCase.arguments;

            let argument = '';
            if (kase.arguments && kase.arguments.length > 0) {
                argument = kase.arguments[0];
            }

            return (
                <div
                    key={`translate_${kase.uuid}`}
                    data-spec="operator-field"
                    className={styles.translating_operator_container}
                >
                    <div data-spec="verbose-name" className={styles.translating_operator}>
                        {verboseName}
                    </div>
                    <div data-spec="argument-to-translate" className={styles.translating_from}>
                        {orginalArgument}
                    </div>
                    <div className={styles.translating_to}>
                        <TextInputElement
                            data-spec="localize-case"
                            name={kase.uuid}
                            placeholder={`${this.props.language.name} Translation`}
                            showLabel={false}
                            onChange={(arg: string) => this.handleUpdateCaseArgument(kase, arg)}
                            entry={{ value: argument }}
                        />
                    </div>
                </div>
            );
        });
    }

    public renderCategories(): JSX.Element[] {
        return this.state.categories.map((cat: Category) => {
            const originalCategory = getOriginalCategory(this.props.nodeSettings, cat.uuid);

            const placeholder = `${this.props.language.name} Translation`;

            if (!cat.name) {
                cat.name = '';
            }

            return (
                <div key={cat.uuid} className={styles.translating_category}>
                    <div data-spec="category-name" className={styles.translating_from}>
                        {originalCategory.name}
                    </div>
                    <div className={styles.translating_to}>
                        <TextInputElement
                            data-spec="localize-category"
                            name={cat.name}
                            placeholder={placeholder}
                            showLabel={false}
                            entry={{ value: cat.name }}
                            onChange={(name: string) => this.handleUpdateCategoryName(cat, name)}
                        />
                    </div>
                </div>
            );
        });
    }

    public render(): JSX.Element {
        const typeConfig = determineTypeConfig(this.props.nodeSettings);

        const tabs: Tab[] = [];

        if (this.state.cases.length > 0) {
            tabs.push({
                name: 'Rule Translations',
                body: (
                    <>
                        <p data-spec="instructions">
                            Sometimes languages need special rules to route things properly. If a
                            translation is not provided, the original rule will be used.
                        </p>
                        {this.renderCases()}
                    </>
                )
            });
        }

        const categories = (
            <Dialog
                title={`${this.props.language.name} Category Names`}
                headerClass={typeConfig.type}
                buttons={this.getButtons()}
                tabs={tabs}
            >
                <p data-spec="instructions">
                    When category names are referenced later in the flow, the appropriate language
                    for the category will be used. If no translation is provided, the original text
                    will be used.
                </p>
                {this.renderCategories()}
            </Dialog>
        );

        const back = (
            <Dialog
                title={`${this.props.language.name} Rules`}
                headerStyle={HeaderStyle.BARBER}
                headerClass={typeConfig.type}
                headerIcon="fe-cog"
                subtitle="Advanced Settings"
                buttons={this.getButtons()}
            >
                <p data-spec="instructions">
                    Sometimes languages need special rules to route things properly. If a
                    translation is not provided, the original rule will be used.
                </p>
                {this.renderCases()}
            </Dialog>
        );

        // if we have cases, use a flipper

        return categories;
    }
}
