export const EXTENSION_NAME = 'content-island-vscode';

export const EXPLORER_VIEW_ID = 'contentIslandExplorer';

export const SETTINGS_KEYS = {
  NAMESPACE_ID: EXTENSION_NAME,
  DOMAIN: 'domain',
  LOGIN_DOMAIN: 'loginDomain',
  API_VERSION: 'apiVersion',
  SECURE_PROTOCOL: 'secureProtocol',
};

export const COMMANDS = {
  REFRESH_TREE: `${EXTENSION_NAME}.refreshTree`,
  OPEN_FILE: `${EXTENSION_NAME}.openFile`,
  DELETE_FILE: `${EXTENSION_NAME}.deleteFile`,
  PULL_CONTENT: `${EXTENSION_NAME}.pullContent`,
  PUSH_CONTENT: `${EXTENSION_NAME}.pushContent`,
  DISCARD: `${EXTENSION_NAME}.discard`,
};

export const FILE_RESOURCE_SCHEME = 'content-island-scheme';
