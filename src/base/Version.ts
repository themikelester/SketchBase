declare const __COMMIT_HASH: string;
declare const __GITHUB_URL: string;
declare const __BUILD_HASH: string;
declare const __BUILD_DATE: Date;
declare const __DEBUG_MODE: boolean;

export const GIT_REVISION: string = __COMMIT_HASH;
export const GIT_SHORT_REVISION = GIT_REVISION.slice( 0, 8 );

export const GITHUB_URL = __GITHUB_URL;
export const GITHUB_REVISION_URL = `${GITHUB_URL}/tree/${GIT_REVISION}`;

export const BUILD_HASH = __BUILD_HASH;
export const BUILD_DATE = __BUILD_DATE;

export const IS_DEVELOPMENT: boolean = process.env.NODE_ENV === 'development';
export const IS_DEBUG_MODE: boolean = __DEBUG_MODE;
