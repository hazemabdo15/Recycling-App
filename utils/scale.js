import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;

export const scaleSize = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
