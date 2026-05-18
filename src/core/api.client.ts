import { createClient, type VSCodeApiClient } from '@content-island/vscode-api-client';
import * as vscode from 'vscode';
import { SETTINGS_KEYS } from './constants';

let client: VSCodeApiClient;

const createVSCodeClient = () => {
  const settings = vscode.workspace.getConfiguration('contentIsland');
  client = createClient({
    domain: settings.get<string>(SETTINGS_KEYS.DOMAIN),
    loginDomain: settings.get<string>(SETTINGS_KEYS.LOGIN_DOMAIN),
    secureProtocol: settings.get<boolean>(SETTINGS_KEYS.SECURE_PROTOCOL),
    apiVersion: settings.get<string>(SETTINGS_KEYS.API_VERSION),
  });
};

export const getClient = (): VSCodeApiClient => {
  if (!client) {
    createVSCodeClient();
  }
  return client;
};

vscode.workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('contentIsland')) {
    createVSCodeClient();
  }
});
