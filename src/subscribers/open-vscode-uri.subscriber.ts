import { type PullContentByIds } from '#commands';
import { getClient } from '#core/api.client';
import { COMMANDS, URI_QUERY_PARAMS } from '#core/constants';
import * as vscode from 'vscode';

export const onOpenVSCodeURI = async (uri: vscode.Uri) => {
  const command = uri.path;
  const params = new URLSearchParams(uri.query);
  const authorizationCode = params.get(URI_QUERY_PARAMS.AUTHORIZATION_CODE);
  const metadata = params.get(URI_QUERY_PARAMS.METADATA);
  if (authorizationCode && metadata) {
    try {
      await getClient().authorize(authorizationCode, metadata);
    } catch (error) {
      vscode.window.showErrorMessage(error.message);
      return;
    }
  }

  if (command === `/${COMMANDS.PULL_CONTENT}`) {
    const contentId = params.get('contentId');
    const fieldId = params.get('fieldId');
    const pullContentProps: PullContentByIds = {
      contentId,
      fieldId,
    };
    vscode.commands.executeCommand(COMMANDS.PULL_CONTENT, pullContentProps);
  }
};
