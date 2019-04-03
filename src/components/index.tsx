import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import { connect, Provider as ReduxProvider } from 'react-redux';
import { bindActionCreators } from 'redux';
import Button, { ButtonTypes } from '~/components/button/Button';
import ConnectedFlow from '~/components/flow/Flow';
import * as styles from '~/components/index.scss';
import ConnectedLanguageSelector from '~/components/languageselector/LanguageSelector';
import { RevisionExplorer } from '~/components/revisions/RevisionExplorer';
import ConfigProvider, { fakePropType } from '~/config/ConfigProvider';
import { FlowDefinition, FlowEditorConfig } from '~/flowTypes';
import createStore from '~/store/createStore';
import { Asset, Assets, AssetStore, RenderNodeMap } from '~/store/flowContext';
import { getCurrentDefinition } from '~/store/helpers';
import AppState from '~/store/state';
import {
    DispatchWithState,
    FetchFlow,
    fetchFlow,
    LoadFlowDefinition,
    loadFlowDefinition,
    MergeEditorState,
    mergeEditorState
} from '~/store/thunks';
import { ACTIVITY_INTERVAL, downloadJSON, renderIf } from '~/utils';

const { default: PageVisibility } = require('react-page-visibility');

export interface FlowEditorContainerProps {
    config: FlowEditorConfig;
}

export interface FlowEditorStoreProps {
    assetStore: AssetStore;
    language: Asset;
    languages: Assets;
    simulating: boolean;
    translating: boolean;
    fetchingFlow: boolean;
    definition: FlowDefinition;
    dependencies: FlowDefinition[];
    fetchFlow: FetchFlow;
    loadFlowDefinition: LoadFlowDefinition;
    mergeEditorState: MergeEditorState;
    nodes: RenderNodeMap;
}

const hotStore = createStore();

// Root container, wires up context-providers
const FlowEditorContainer: React.SFC<FlowEditorContainerProps> = ({ config }) => {
    return (
        <ConfigProvider config={{ ...config }}>
            <ReduxProvider store={hotStore}>
                <ConnectedFlowEditor />
            </ReduxProvider>
        </ConfigProvider>
    );
};

export const contextTypes = {
    config: fakePropType
};

export const editorContainerSpecId = 'editor-container';
export const editorSpecId = 'editor';

/**
 * The main editor view for editing a flow
 */
export class FlowEditor extends React.Component<FlowEditorStoreProps> {
    public static contextTypes = contextTypes;

    constructor(props: FlowEditorStoreProps) {
        super(props);
        bindCallbacks(this, {
            include: [/^handle/]
        });
    }

    public componentDidMount(): void {
        this.props.fetchFlow(
            this.context.config.endpoints,
            this.context.config.flow,
            this.context.config.onLoad
        );
    }

    private handleDownloadClicked(): void {
        downloadJSON(getCurrentDefinition(this.props.definition, this.props.nodes), 'definition');
    }

    private handleVisibilityChanged(visible: boolean): void {
        this.props.mergeEditorState({ visible, activityInterval: ACTIVITY_INTERVAL });
    }

    public getFooter(): JSX.Element {
        return !this.props.fetchingFlow && this.context.config.showDownload ? (
            <div className={styles.footer}>
                <div className={styles.downloadButton}>
                    <Button
                        name="Download"
                        onClick={this.handleDownloadClicked}
                        type={ButtonTypes.primary}
                    />
                </div>
            </div>
        ) : null;
    }

    public render(): JSX.Element {
        return (
            <PageVisibility onChange={this.handleVisibilityChanged}>
                <div
                    id={editorContainerSpecId}
                    className={this.props.translating ? styles.translating : undefined}
                    data-spec={editorContainerSpecId}
                >
                    {this.getFooter()}
                    <div className={styles.editor} data-spec={editorSpecId}>
                        {renderIf(
                            this.props.languages &&
                                Object.keys(this.props.languages.items).length > 0
                        )(<ConnectedLanguageSelector />)}
                        {renderIf(
                            this.props.definition && this.props.language && !this.props.fetchingFlow
                        )(<ConnectedFlow />)}

                        <RevisionExplorer
                            simulating={this.props.simulating}
                            loadFlowDefinition={this.props.loadFlowDefinition}
                            assetStore={this.props.assetStore}
                        />
                    </div>
                </div>
            </PageVisibility>
        );
    }
}

const mapStateToProps = ({
    flowContext: { definition, dependencies, nodes, assetStore },
    editorState: { translating, language, fetchingFlow, simulating }
}: AppState) => {
    const languages = assetStore ? assetStore.languages : null;

    return {
        simulating,
        assetStore,
        translating,
        language,
        fetchingFlow,
        definition,
        dependencies,
        nodes,
        languages
    };
};

const mapDispatchToProps = (dispatch: DispatchWithState) =>
    bindActionCreators(
        {
            fetchFlow,
            loadFlowDefinition,
            mergeEditorState
        },
        dispatch
    );

export const ConnectedFlowEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(FlowEditor);

export default FlowEditorContainer;
