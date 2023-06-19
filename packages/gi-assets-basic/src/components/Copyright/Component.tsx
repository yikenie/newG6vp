import { utils } from '@antv/gi-sdk';
import React from 'react';
import './index.less';
const { getPositionStyles } = utils;

export interface CopyrightProps {
    imageUrl: string;
    width: number;
    height: number;
    placement: string;
    offset: number[];
}

const Copyright: React.FunctionComponent<CopyrightProps> = props => {
    const { imageUrl, width, height, placement, offset } = props;
    const positionStyles = getPositionStyles(placement, offset);

    return (
        <div className="gi-copyright" style={positionStyles}>

        </div>
    );
};

export default Copyright;
