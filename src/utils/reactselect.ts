import { StylesConfig } from 'react-select/lib/styles';
import { border } from '~/components/form/FormElement.scss';

export const large = {
    control: (styles: StylesConfig, state: any) => {
        return {
            ...styles,
            borderColor: '#ccc',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#ccc'
            }
        };
    }
};

export const messageStyle = {
    control: (styles: StylesConfig, state: any) => {
        return {
            ...styles,
            borderColor: '#ccc',
            boxShadow: 'none',
            borderBottom: 'none',
            borderBottomRightRadius: '0px',
            borderBottomLeftRadius: '0px',
            '&:hover': {
                borderColor: '#ccc'
            }
        };
    }
};

export const small = {
    control: (styles: StylesConfig) => ({
        ...styles,
        borderColor: '#ccc',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#ccc'
        },
        minHeight: 28,
        maxHeight: 28,
        fontSize: 12
    }),
    menuList: (styles: StylesConfig) => ({
        ...styles,
        maxHeight: 200
    }),
    option: (styles: StylesConfig) => ({
        ...styles,
        fontSize: 12
    }),
    singleValue: (styles: StylesConfig) => ({
        ...styles,
        maxHeight: 28
    }),
    indicatorsContainer: (styles: StylesConfig) => ({
        ...styles,
        height: 28,
        maxHeight: 28
    }),
    valueContainer: (styles: StylesConfig) => ({
        ...styles,
        height: 28,
        maxHeight: 28
    }),
    input: (styles: StylesConfig) => ({
        ...styles,
        margin: 0
    })
};

export const tagging = {
    control: (styles: StylesConfig, state: any) => {
        return {
            ...styles,
            borderColor: '#ccc',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#ccc'
            }
        };
    },
    multiValue: (styles: StylesConfig) => {
        return {
            ...styles,
            maxHeight: 24,
            minHeight: 24,
            lineHeight: '17px',
            backgroundColor: 'hsl(0, 0%, 94%)',
            border: '1px solid hsl(0, 0%, 85%)'
        };
    }
};
