
let withSpring, withTiming;

try {
  const reanimated = require('react-native-reanimated');
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {


  withSpring = (value, config) => value;
  withTiming = (value, config) => value;
}

export const ANIMATION_CONFIG = {

  pageTransition: {
    duration: 300,
    easing: 'ease-out',
  },

  cardPress: {
    scale: {
      pressed: 0.96,
      normal: 1,
    },
    timing: {
      damping: 15,
      stiffness: 200,
    },
  },

  fade: {
    duration: 250,
  },

  slide: {
    duration: 300,
    damping: 15,
    stiffness: 150,
  },

  button: {
    scale: {
      pressed: 0.95,
      normal: 1,
    },
    timing: {
      damping: 20,
      stiffness: 300,
    },
  },

  listItem: {
    stagger: 50,
    slide: {
      from: 30,
      to: 0,
      duration: 400,
      damping: 20,
      stiffness: 100,
    },
    fade: {
      from: 0,
      to: 1,
      duration: 300,
    },
  },

  modal: {
    backdrop: {
      duration: 200,
    },
    slide: {
      duration: 350,
      damping: 25,
      stiffness: 150,
    },
  },
};

export const createSpringAnimation = (config = {}) => {
  return withSpring(config.toValue || 1, {
    damping: config.damping || 15,
    stiffness: config.stiffness || 150,
    ...config,
  });
};

export const createTimingAnimation = (config = {}) => {
  return withTiming(config.toValue || 1, {
    duration: config.duration || 300,
    ...config,
  });
};

export const PRESET_ANIMATIONS = {
  fadeIn: (duration = 300) => createTimingAnimation({ toValue: 1, duration }),
  fadeOut: (duration = 300) => createTimingAnimation({ toValue: 0, duration }),
  
  slideInUp: (distance = 30) => createSpringAnimation({ 
    toValue: 0, 
    damping: 20, 
    stiffness: 100 
  }),
  
  slideInDown: (distance = 30) => createSpringAnimation({ 
    toValue: 0, 
    damping: 20, 
    stiffness: 100 
  }),

  slideInLeft: () => createSpringAnimation({ 
    toValue: 0, 
    damping: 20, 
    stiffness: 150 
  }),
  
  slideInRight: () => createSpringAnimation({ 
    toValue: 0, 
    damping: 20, 
    stiffness: 150 
  }),
  
  scaleIn: () => createSpringAnimation({ 
    toValue: 1, 
    damping: 15, 
    stiffness: 200 
  }),
  
  scaleOut: () => createSpringAnimation({ 
    toValue: 0.8, 
    damping: 15, 
    stiffness: 200 
  }),
  
  buttonPress: () => createSpringAnimation({ 
    toValue: 0.95, 
    damping: 20, 
    stiffness: 300 
  }),
  
  buttonRelease: () => createSpringAnimation({ 
    toValue: 1, 
    damping: 20, 
    stiffness: 300 
  }),
};
