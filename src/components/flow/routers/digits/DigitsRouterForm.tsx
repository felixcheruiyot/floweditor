import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import Dialog, { ButtonSet } from '~/components/dialog/Dialog';
import { RouterFormProps } from '~/components/flow/props';
import CaseList, { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import OptionalTextInput from '~/components/form/optionaltext/OptionalTextInput';
import TypeList from '~/components/nodeeditor/TypeList';
import { FormState, StringEntry } from '~/store/nodeEditor';

import * as styles from './DigitsRouterForm.scss';
import { nodeToState, stateToNode } from './helpers';

export interface DigitsRouterFormState extends FormState {
    cases: CaseProps[];
    resultName: StringEntry;
}

export default class DigitsRouterForm extends React.Component<
    RouterFormProps,
    DigitsRouterFormState
> {
    constructor(props: RouterFormProps) {
        super(props);

        this.state = nodeToState(this.props.nodeSettings);

        bindCallbacks(this, {
            include: [/^on/, /^handle/]
        });
    }

    private handleUpdateResultName(value: string): void {
        this.setState({ resultName: { value } });
    }

    private handleCasesUpdated(cases: CaseProps[]): void {
        this.setState({ cases });
    }

    private handleSave(): void {
        if (this.state.valid) {
            this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
            this.props.onClose(false);
        }
    }

    private getButtons(): ButtonSet {
        return {
            primary: { name: 'Ok', onClick: this.handleSave },
            secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
        };
    }

    public renderEdit(): JSX.Element {
        const typeConfig = this.props.typeConfig;

        return (
            <Dialog
                title={typeConfig.name}
                headerClass={typeConfig.type}
                buttons={this.getButtons()}
            >
                <TypeList
                    __className=""
                    initialType={typeConfig}
                    onChange={this.props.onTypeChange}
                />
                <p className={styles.leadIn}>If the keypad entry before the # symbol..</p>
                <CaseList
                    data-spec="cases"
                    cases={this.state.cases}
                    onCasesUpdated={this.handleCasesUpdated}
                />
                <OptionalTextInput
                    name="Result Name"
                    value={this.state.resultName}
                    onChange={this.handleUpdateResultName}
                    toggleText="Save as.."
                    helpText="By naming the result, you can reference it later using @run.results.whatever_the_name_is"
                />
            </Dialog>
        );
    }

    public render(): JSX.Element {
        return this.renderEdit();
    }
}
