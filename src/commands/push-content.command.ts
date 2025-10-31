import { getClient } from '#core/api.client';
import type { ContentIslandFileSystemProvider, FileMetadata } from '#providers/file-system';
import type { ContentIslandTreeItem, TreeItemType } from '#providers/tree';
import * as vscode from 'vscode';

export type PushContentProps = ContentIslandTreeItem | vscode.Uri;

const isContentIslandTreeItem = (props: PushContentProps): props is ContentIslandTreeItem => {
  return 'treeItem' in props;
};

const isVscodeUri = (props: PushContentProps): props is vscode.Uri => {
  return props instanceof vscode.Uri;
};

const getPushProps = async (
  props: PushContentProps,
  fsProvider: ContentIslandFileSystemProvider
): Promise<{
  fileMetadata: FileMetadata;
  type: TreeItemType;
  children?: ContentIslandTreeItem[];
}> => {
  if (isContentIslandTreeItem(props)) {
    return {
      fileMetadata: props.fileMetadata,
      type: props.treeItem.type,
      children: props.children,
    };
  } else if (isVscodeUri(props)) {
    const fileMetadata = fsProvider.getFileMetadata(props);
    if (fileMetadata) {
      return {
        fileMetadata,
        type: 'field',
      };
    }
  } else {
    throw new Error('Invalid properties provided to push content.');
  }
};

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
    const { fileMetadata, type, children } = await getPushProps(props, fsProvider);
    if (type === 'field') {
      await pushOneField(fileMetadata, fsProvider);
      vscode.window.showInformationMessage('Content pushed successfully.');
    } else if (type === 'content') {
      const fieldItems =
        children?.filter(child => child.treeItem.type === 'field' && child.fileMetadata.pendingToPush) || [];
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
