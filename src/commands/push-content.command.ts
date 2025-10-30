import { getClient } from '#core/api.client';
import type { ContentIslandFileSystemProvider, FileMetadata } from '#providers/file-system';
import type { ContentIslandTreeItem } from '#providers/tree';
import * as vscode from 'vscode';

export type PushContentProps = ContentIslandTreeItem;

const pushOneField = async (fileMetadata: FileMetadata, fsProvider: ContentIslandFileSystemProvider): Promise<void> => {
  if (!fileMetadata.pendingToPush) {
    vscode.window.showInformationMessage('No changes to push.');
    return;
  }
  try {
    const apiClient = getClient();
    await apiClient.authorizeByProjectId(fileMetadata.project.id);
    const uri = fsProvider.getUri(fileMetadata);
    const value = (await fsProvider.readFile(uri)).toString();
    await apiClient.updateContentFieldValue(fileMetadata.content.id, fileMetadata.field.id, value);
    await fsProvider.setFileMetadata(
      {
        ...fileMetadata,
        pendingToPush: false,
      },
      uri
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error on field "[${fileMetadata.field.language}] ${fileMetadata.field.name}": ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};

export const pushContent =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: PushContentProps): Promise<void> => {
    if (props.treeItem.type === 'field') {
      const fileMetadata = props.fileMetadata;
      await pushOneField(fileMetadata, fsProvider);
      vscode.window.showInformationMessage('Content pushed successfully.');
    } else if (props.treeItem.type === 'content') {
      const fieldItems =
        props.children?.filter(child => child.treeItem.type === 'field' && child.fileMetadata.pendingToPush) || [];
      let errors = 0;
      for (const fieldItem of fieldItems) {
        const fileMetadata = fieldItem.fileMetadata;
        try {
          await pushOneField(fileMetadata, fsProvider);
        } catch {
          errors++;
        }
      }
      vscode.window.showInformationMessage(
        errors > 0 ? `Content push completed with ${errors} error(s).` : 'All content changes pushed successfully.'
      );
    }
  };
