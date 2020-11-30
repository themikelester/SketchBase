declare const __COMMIT_HASH: string;
declare const __GITHUB_URL: string;

export const GIT_REVISION: string = __COMMIT_HASH;
export const GIT_SHORT_REVISION = GIT_REVISION.slice( 0, 8 );

export const GITHUB_URL = __GITHUB_URL;
export const GITHUB_REVISION_URL = `${GITHUB_URL}/tree/${GIT_REVISION}`;

export const IS_DEVELOPMENT: boolean = process.env.NODE_ENV === 'development';
