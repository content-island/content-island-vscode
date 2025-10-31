import { createClient, type VSCodeApiClient } from '@content-island/vscode-api-client';
import * as vscode from 'vscode';

let client: VSCodeApiClient;

const createVSCodeClient = () => {
  const settings = vscode.workspace.getConfiguration('contentIsland');
  client = createClient({
    domain: settings.get<string>('domain'),
    loginDomain: settings.get<string>('loginDomain'),
    secureProtocol: settings.get<boolean>('secureProtocol'),
    apiVersion: settings.get<string>('apiVersion'),
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
