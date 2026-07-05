const IS_DEV = import.meta.env.MODE === 'development';

export const storage = IS_DEV ? window.sessionStorage : window.localStorage;
