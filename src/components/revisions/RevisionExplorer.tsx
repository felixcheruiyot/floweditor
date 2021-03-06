import { react as bindCallbacks } from 'auto-bind';
import * as classNames from 'classnames/bind';
import dateFormat = require('dateformat');
import * as React from 'react';
import { PopTab } from '~/components/poptab/PopTab';
import { getAssets, getFlowDefinition } from '~/external';
import { FlowDefinition } from '~/flowTypes';
import { Asset, AssetStore } from '~/store/flowContext';
import { loadFlowDefinition } from '~/store/thunks';
import { renderIf } from '~/utils';

import * as styles from './RevisionExplorer.scss';

const cx = classNames.bind(styles);

export interface User {
    email: string;
    name: string;
}

export interface Revision {
    version: string;
    revision: number;
    created_on: string;
    user: User;
    current: boolean;
}

export interface RevisionExplorerProps {
    simulating: boolean;
    assetStore: AssetStore;
    loadFlowDefinition: (definition: FlowDefinition, assetStore: AssetStore) => void;
    utc?: boolean;
}

export interface RevisionExplorerState {
    revisions: Asset[];
    revision: Asset;
    definition: FlowDefinition;
    visible: boolean;
}

export class RevisionExplorer extends React.Component<
    RevisionExplorerProps,
    RevisionExplorerState
> {
    constructor(props: RevisionExplorerProps) {
        super(props);
        this.state = {
            revisions: [],
            revision: null,
            definition: null,
            visible: false
        };

        bindCallbacks(this, {
            include: [/^handle/]
        });
    }

    public handleUpdateRevisions(): Promise<void> {
        if (this.props.assetStore !== null) {
            const assets = this.props.assetStore.revisions;
            return getAssets(assets.endpoint, assets.type, assets.id || 'id').then(
                (remoteAssets: Asset[]) => {
                    if (remoteAssets.length > 0) {
                        remoteAssets[0].content.current = true;
                    }
                    this.setState({ revisions: remoteAssets });
                }
            );
        }
    }

    public handleTabClicked(): void {
        this.setState(
            (prevState: RevisionExplorerState) => {
                return { visible: !prevState.visible };
            },
            () => {
                if (this.state.visible) {
                    this.handleUpdateRevisions();
                } else {
                    if (
                        this.state.revision &&
                        this.state.revision.id !== this.state.revisions[0].id
                    ) {
                        getFlowDefinition(
                            this.props.assetStore.revisions,
                            this.state.revisions[0].id
                        ).then((definition: FlowDefinition) => {
                            this.props.loadFlowDefinition(definition, this.props.assetStore);
                            this.setState({ revision: null });
                        });
                    }
                }
            }
        );
    }

    public handleRevisionClicked(revision: Asset): void {
        getFlowDefinition(this.props.assetStore.revisions, revision.id).then(
            (definition: FlowDefinition) => {
                this.props.loadFlowDefinition(definition, this.props.assetStore);
                this.setState({ revision });
            }
        );
    }

    public render(): JSX.Element {
        const classes = cx({
            [styles.visible]: this.state.visible,
            [styles.simulating]: this.props.simulating
        });

        return (
            <div className={classes}>
                <div className={styles.mask} />
                <PopTab
                    header="Revisions"
                    color="#8e5ea7"
                    icon="fe-time"
                    label="Revision History"
                    top="360px"
                    onShow={this.handleTabClicked}
                    onHide={this.handleTabClicked}
                >
                    <div className={styles.explorerWrapper}>
                        <div className={styles.explorer}>
                            <div className={styles.revisions}>
                                {this.state.revisions.map((asset: Asset) => {
                                    const revision = asset.content as Revision;

                                    const isSelected =
                                        this.state.revision && asset.id === this.state.revision.id;

                                    const selectedClass =
                                        revision.current || isSelected ? styles.selected : '';

                                    return (
                                        <div
                                            className={styles.revision + ' ' + selectedClass}
                                            key={'revision_' + asset.id}
                                            onClick={() => {
                                                this.handleRevisionClicked(asset);
                                            }}
                                        >
                                            {renderIf(revision.current)(
                                                <div
                                                    className={styles.button + ' ' + styles.current}
                                                >
                                                    current
                                                </div>
                                            )}
                                            {renderIf(isSelected && !revision.current)(
                                                <div className={styles.button}>revert</div>
                                            )}
                                            <div className={styles.createdOn}>
                                                {dateFormat(
                                                    new Date(revision.created_on),
                                                    'mmmm d, yyyy, h:MM TT',
                                                    this.props.utc
                                                )}
                                            </div>
                                            <div className={styles.email}>
                                                {revision.user.name || revision.user.email}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </PopTab>
            </div>
        );
    }
}
