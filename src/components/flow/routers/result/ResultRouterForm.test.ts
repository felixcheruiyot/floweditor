import { RouterFormProps } from '~/components/flow/props';
import ResultRouterForm from '~/components/flow/routers/result/ResultRouterForm';
import { Types } from '~/config/interfaces';
import { AssetType } from '~/store/flowContext';
import { composeComponentTestUtils, mock } from '~/testUtils';
import { createRenderNode, getRouterFormProps } from '~/testUtils/assetCreators';
import * as utils from '~/utils';

const { setup } = composeComponentTestUtils<RouterFormProps>(
    ResultRouterForm,
    getRouterFormProps(
        createRenderNode({
            actions: [],
            exits: [],
            ui: {
                position: { left: 0, top: 0 },
                type: Types.split_by_run_result,
                config: {
                    router: {
                        operandAsset: {
                            id: 'favorite_color',
                            name: 'Favorite Color',
                            type: AssetType.Result
                        }
                    }
                }
            }
        })
    )
);

mock(utils, 'createUUID', utils.seededUUIDs());

describe(ResultRouterForm.name, () => {
    it('should render', () => {
        const { wrapper } = setup(true);
        expect(wrapper).toMatchSnapshot();
    });
});
