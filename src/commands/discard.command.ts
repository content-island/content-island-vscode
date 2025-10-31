import type { ContentIslandFileSystemProvider } from '#providers/file-system';
import * as vscode from 'vscode';
import { pullContent, type PullContentProps } from './pull-content.command';

export const discard =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: PullContentProps): Promise<void> => {
    const answer = await vscode.window.showWarningMessage(
      'Are you sure you want to discard local changes and reload the content from the server?',
      { modal: true },
      'Discard Changes'
    );
    if (answer !== 'Discard Changes') {
      return;
    }
    return await pullContent(fsProvider)(props);
  };
