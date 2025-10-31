import type { ContentIslandFileSystemProvider } from '#providers/file-system/file-system.provider.js';
import * as vscode from 'vscode';

export const refresh = (fsProvider: ContentIslandFileSystemProvider) => async (): Promise<void> => {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
    },
    async () => {
      await fsProvider.loadMetadata();
    }
  );
};
