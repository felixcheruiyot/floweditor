import { react as bindCallbacks } from 'auto-bind';
import mutate from 'immutability-helper';
import * as React from 'react';
import { CanvasDraggable, CanvasDraggableProps } from '~/components/canvas/CanvasDraggable';
import { getDraggablesInBox, reflow } from '~/components/canvas/helpers';
import { DRAG_THRESHOLD } from '~/components/flow/Flow';
import { dragGroup } from '~/components/flow/node/Node.scss';
import { Dimensions, FlowPosition } from '~/flowTypes';
import { CanvasPositions, DragSelection } from '~/store/editor';
import { addPosition } from '~/store/helpers';
import { MergeEditorState } from '~/store/thunks';
import { COLLISION_FUDGE, snapPositionToGrid } from '~/utils';

import * as styles from './Canvas.scss';

export const CANVAS_PADDING = 300;
export const REFLOW_QUIET = 200;

export interface CanvasProps {
    uuid: string;
    dragActive: boolean;
    draggables: CanvasDraggableProps[];
    onDragging: (draggedUUIDs: string[]) => void;
    onUpdatePositions: (positions: CanvasPositions) => void;
    mergeEditorState: MergeEditorState;
}

interface CanvasState {
    dragDownPosition: FlowPosition;
    dragUUID: string;
    dragGroup: boolean;
    dragSelection: DragSelection;
    uuid: string;
    positions: CanvasPositions;
    selected: CanvasPositions;
    height: number;
}

export class Canvas extends React.PureComponent<CanvasProps, CanvasState> {
    private ele: HTMLDivElement;
    private parentOffset: FlowPosition;
    private isScrolling: any;

    private reflowTimeout: any;

    // when auto scrolling we need to move dragged elements
    private lastX: number;
    private lastY: number;

    // did we just select something
    private justSelected = false;

    constructor(props: CanvasProps) {
        super(props);

        let height = 1000;

        const positions: { [uuid: string]: FlowPosition } = {};
        this.props.draggables.forEach((draggable: CanvasDraggableProps) => {
            positions[draggable.uuid] = draggable.position;
            if (draggable.position.bottom) {
                height = Math.max(height, draggable.position.bottom + CANVAS_PADDING);
            }
        });

        this.state = {
            height,
            dragDownPosition: null,
            dragUUID: null,
            dragGroup: false,
            dragSelection: null,
            uuid: this.props.uuid,
            selected: {},
            positions
        };

        bindCallbacks(this, {
            include: [/^handle/, /^render/]
        });
    }

    public componentDidMount(): void {
        let offset = { left: 0, top: 0 };
        /* istanbul ignore next */
        if (this.ele) {
            offset = this.ele.getBoundingClientRect();
        }
        this.parentOffset = { left: offset.left, top: offset.top + window.scrollY };
    }

    public componentDidUpdate(prevProps: CanvasProps): void {
        let updated = false;
        let updatedPositions = this.state.positions;

        // are we being given something new
        this.props.draggables.forEach((draggable: CanvasDraggableProps) => {
            if (!this.state.positions[draggable.uuid]) {
                updatedPositions = mutate(updatedPositions, {
                    $merge: { [draggable.uuid]: draggable.position }
                });
                updated = true;
            }
        });

        // have we removed something
        Object.keys(updatedPositions).forEach((uuid: string) => {
            if (
                !this.props.draggables.find(
                    (draggable: CanvasDraggableProps) => draggable.uuid === uuid
                )
            ) {
                updatedPositions = mutate(updatedPositions, { $unset: [[uuid]] });
                updated = true;
            }
        });

        if (updated) {
            this.setState({ positions: updatedPositions });
        }
    }

    public renderSelectionBox(): JSX.Element {
        const drag = this.state.dragSelection;

        if (drag) {
            const left = Math.min(drag.startX, drag.currentX);
            const top = Math.min(drag.startY, drag.currentY);
            const width = Math.max(drag.startX, drag.currentX) - left;
            const height = Math.max(drag.startY, drag.currentY) - top;
            if (this.state.dragSelection && this.state.dragSelection.startX) {
                return (
                    <div className={styles.dragSelection} style={{ left, top, width, height }} />
                );
            }
        }

        return null;
    }

    private isClickOnCanvas(event: React.MouseEvent<HTMLDivElement>): boolean {
        return (event.target as any).id === this.state.uuid;
    }

    private handleMouseDown(event: React.MouseEvent<HTMLDivElement>): void {
        this.justSelected = false;

        if (this.isClickOnCanvas(event)) {
            this.setState({
                dragSelection: {
                    startX: event.pageX - this.parentOffset.left,
                    startY: event.pageY - this.parentOffset.top,
                    currentX: event.pageX - this.parentOffset.left,
                    currentY: event.pageY - this.parentOffset.top
                }
            });
        }
    }

    private handleMouseMove(event: React.MouseEvent<HTMLDivElement>): void {
        if (this.state.dragSelection && this.state.dragSelection.startX) {
            const drag = this.state.dragSelection;
            const left = Math.min(drag.startX, drag.currentX);
            const top = Math.min(drag.startY, drag.currentY);
            const right = Math.max(drag.startX, drag.currentX);
            const bottom = Math.max(drag.startY, drag.currentY);

            const selected = getDraggablesInBox(this.state.positions, { left, top, right, bottom });

            this.setState({
                dragSelection: {
                    startX: drag.startX,
                    startY: drag.startY,
                    currentX: event.pageX - this.parentOffset.left,
                    currentY: event.pageY - this.parentOffset.top
                }
            });

            this.setState({ selected });

            if (Object.keys(selected).length > 0) {
                this.justSelected = true;
            }
        }

        if (this.state.dragUUID) {
            this.updatePositions(event.pageX, event.pageY, event.clientY, false);
        }
    }

    private scrollCanvas(amount: number): void {
        if (!this.isScrolling) {
            this.isScrolling = true;

            let speed = amount;
            if (window.scrollY + amount < 0) {
                speed = 0;
            }

            this.isScrolling = window.setInterval(() => {
                if (this.lastX && this.lastY) {
                    // as we scroll we need to move our dragged items along with us
                    this.updatePositions(this.lastX, this.lastY + speed, 0, false);
                    window.scrollBy(0, speed);
                }
            }, 30);
        }
    }

    private handleMouseUp(event: React.MouseEvent<HTMLDivElement>): void {
        this.lastX = null;
        this.lastY = null;
        if (this.state.dragUUID) {
            this.setState({
                dragDownPosition: null,
                dragSelection: null,
                dragUUID: null
            });
        }

        if (!this.justSelected) {
            this.props.mergeEditorState({
                dragActive: false
            });

            this.setState({ selected: {} });
        }

        if (this.state.dragSelection && this.state.dragSelection.startX) {
            this.setState({
                dragSelection: {
                    startX: null,
                    startY: null,
                    currentX: null,
                    currentY: null
                }
            });
        }

        this.justSelected = false;
    }

    public handleUpdateDimensions(uuid: string, dimensions: Dimensions): void {
        let pos = this.state.positions[uuid];
        if (!pos) {
            pos = this.props.draggables.find((item: CanvasDraggableProps) => item.uuid === uuid)
                .position;
        }

        const newPosition = {
            left: pos.left,
            top: pos.top,
            right: pos.left + dimensions.width,
            bottom: pos.top + dimensions.height
        };

        if (newPosition.bottom !== pos.bottom || newPosition.right !== pos.right) {
            if (newPosition.right !== pos.right || newPosition.bottom !== pos.bottom) {
                this.setState((prevState: CanvasState) => {
                    const newPositions = mutate(prevState.positions, {
                        $merge: {
                            [uuid]: newPosition
                        }
                    });

                    return {
                        positions: newPositions,
                        height: Math.max(newPosition.bottom + CANVAS_PADDING, prevState.height)
                    };
                });

                this.markReflow();
            }
        }
    }

    public doReflow(): void {
        const { positions, changed } = reflow(this.state.positions, COLLISION_FUDGE);
        if (changed) {
            this.setState({ positions });

            if (changed) {
                this.props.onUpdatePositions(
                    changed.reduce((results: CanvasPositions, uuid: string) => {
                        results[uuid] = positions[uuid];
                        return results;
                    }, {})
                );
            }
        }

        this.props.onDragging(changed);
    }

    private markReflow(): void {
        if (this.reflowTimeout) {
            clearTimeout(this.reflowTimeout);
        }

        this.reflowTimeout = setTimeout(() => {
            // only reflow if we aren't dragging
            if (!this.state.dragUUID) {
                this.doReflow();
            }
        }, REFLOW_QUIET);
    }

    private updatePositions(pageX: number, pageY: number, clientY: number, snap: boolean): void {
        const { dragUUID } = this.state;

        // save off the last update, if we scroll on the user's behalf we'll need this
        this.lastX = pageX;
        this.lastY = pageY;

        const startPosition = this.props.dragActive
            ? this.state.selected[dragUUID]
            : this.state.positions[dragUUID];

        const xd =
            pageX - this.parentOffset.left - this.state.dragDownPosition.left - startPosition.left;

        const yd =
            pageY - this.parentOffset.top - this.state.dragDownPosition.top - startPosition.top;

        let lowestNode = 0;
        if (this.props.dragActive) {
            const delta = { left: xd, top: yd };

            const viewportHeight = document.documentElement.clientHeight;

            this.setState(
                (prevState: CanvasState) => {
                    const uuids = Object.keys(prevState.selected);
                    let newPositions = prevState.positions;
                    uuids.forEach((uuid: string) => {
                        let newPosition = addPosition(prevState.selected[uuid], delta);
                        if (snap) {
                            newPosition = snapPositionToGrid(newPosition);
                        }

                        if (newPosition.bottom > lowestNode) {
                            lowestNode = newPosition.bottom;
                        }

                        newPositions = mutate(newPositions, {
                            $merge: { [uuid]: newPosition }
                        });
                    });

                    this.props.onDragging(uuids);

                    return {
                        positions: newPositions,
                        height: Math.max(prevState.height, lowestNode + CANVAS_PADDING)
                    };
                },
                () => {
                    // check if we need to scroll our canvas
                    if (!this.isScrolling && clientY !== 0) {
                        if (clientY + 100 > viewportHeight) {
                            this.scrollCanvas(15);
                        } else if (clientY < 100) {
                            this.scrollCanvas(-15);
                        }
                    }
                    // if we are scrolling but given a clientY then user is mousing
                    else if (clientY !== 0 && (clientY > 100 && clientY + 100 < viewportHeight)) {
                        window.clearInterval(this.isScrolling);
                        this.isScrolling = null;
                    }
                }
            );
        } else {
            if (Math.abs(xd) + Math.abs(yd) > DRAG_THRESHOLD) {
                let selected = this.state.selected;
                if (!(this.state.dragUUID in selected)) {
                    selected = { [dragUUID]: this.state.positions[dragUUID] };
                }

                this.props.mergeEditorState({
                    dragActive: true
                });

                this.setState({ selected });
            }
        }
    }

    private handleDragStart(uuid: string, position: FlowPosition): void {
        this.setState({
            dragUUID: uuid,
            dragDownPosition: {
                left: position.left - this.parentOffset.left,
                top: position.top - this.parentOffset.top
            }
        });
    }

    /** Gets all the positions for nodes that were dragged */
    private getSelectedPositions(): CanvasPositions {
        return Object.keys(this.state.selected).reduce((result: CanvasPositions, uuid: string) => {
            result[uuid] = this.state.positions[uuid];
            return result;
        }, {});
    }

    private handleDragStop(): void {
        if (this.state.dragUUID) {
            this.updatePositions(this.lastX, this.lastY, 0, true);
        }

        this.props.onUpdatePositions(this.getSelectedPositions());
        this.setState({
            dragUUID: null,
            dragDownPosition: null,
            dragSelection: null
        });

        this.markReflow();

        this.props.mergeEditorState({
            dragActive: false
        });
    }

    public render(): JSX.Element {
        return (
            <div className={styles.canvasContainer}>
                <div
                    style={{ height: this.state.height }}
                    id={this.state.uuid}
                    ref={(ele: HTMLDivElement) => {
                        this.ele = ele;
                    }}
                    className={styles.canvas}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                >
                    {this.props.draggables.map((draggable: CanvasDraggableProps) => {
                        const pos = this.state.positions[draggable.uuid] || draggable.position;
                        return (
                            <CanvasDraggable
                                onAnimated={(uuid: string) => {
                                    this.props.onDragging([uuid]);
                                }}
                                key={'draggable_' + draggable.uuid}
                                uuid={draggable.uuid}
                                updateDimensions={this.handleUpdateDimensions}
                                position={pos}
                                selected={!!this.state.selected[draggable.uuid]}
                                ele={draggable.ele}
                                onDragStart={this.handleDragStart}
                                onDragStop={this.handleDragStop}
                            />
                        );
                    })}
                    {this.props.children}
                    {this.renderSelectionBox()}
                </div>
            </div>
        );
    }
}
