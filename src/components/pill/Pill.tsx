import * as React from 'react';

const styles = require('./Pill.scss');

export interface PillProps {
    advanced?: boolean;
    onClick?(event: React.MouseEvent<HTMLDivElement>): void;
    text: string;
    maxLength?: number;
    icon?: string;
    large?: boolean;
    style?: React.CSSProperties;
}

const Pill: React.SFC<PillProps> = (props: PillProps): JSX.Element => {
    let text = props.text;

    if (props.text.startsWith('@')) {
        text = '@(exp)';
    } else if (props.maxLength && text.length > props.maxLength) {
        text = props.text.substring(0, props.maxLength) + '...';
    }
    return (
        <div
            style={props.style}
            data-advanced={props.advanced}
            onClick={props.onClick}
            className={styles.pill + ' ' + (props.large ? styles.large : '')}
        >
            {text}
            {props.icon ? (
                <span data-advanced={props.advanced} className={styles.icon + ' ' + props.icon} />
            ) : null}
        </div>
    );
};

export default Pill;
