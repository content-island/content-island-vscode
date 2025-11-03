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

const getPushPropsFromTreeItem = (props: ContentIslandTreeItem) => ({
  fileMetadata: props.fileMetadata,
  type: props.treeItem.type,
  children: props.children,
});

const getPushPropsFromUri = async (props: vscode.Uri, fsProvider: ContentIslandFileSystemProvider) => {
  const document = await vscode.workspace.openTextDocument(props);
  if (document.isDirty) {
    await document.save();
  }
  const fileMetadata = fsProvider.getFileMetadata(props);
  if (!fileMetadata) {
    throw new Error('File metadata not found for the provided URI.');
  }

  return {
    fileMetadata,
    type: 'field' as TreeItemType,
  };
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
    return getPushPropsFromTreeItem(props);
  }

  if (isVscodeUri(props)) {
    return await getPushPropsFromUri(props, fsProvider);
  }
  throw new Error('Invalid properties provided to push content.');
};

const pushOneField = async (fileMetadata: FileMetadata, fsProvider: ContentIslandFileSystemProvider): Promise<void> => {
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

const pushSingleField = async (
  fileMetadata: FileMetadata,
  fsProvider: ContentIslandFileSystemProvider
): Promise<void> => {
  if (!fileMetadata.pendingToPush) {
    vscode.window.showInformationMessage('No changes to push.');
    return;
  }
  await pushOneField(fileMetadata, fsProvider);
  vscode.window.showInformationMessage('Content pushed successfully.');
};

const pushMultipleFields = async (
  children: ContentIslandTreeItem[] | undefined,
  fsProvider: ContentIslandFileSystemProvider
): Promise<void> => {
  const fieldItems =
    children?.filter(child => child.treeItem.type === 'field' && child.fileMetadata.pendingToPush) || [];

  const results = await Promise.allSettled(
    fieldItems.map(fieldItem => pushOneField(fieldItem.fileMetadata, fsProvider))
  );

  const errors = results.filter(result => result.status === 'rejected').length;
  const message =
    errors > 0 ? `Content push completed with ${errors} error(s).` : 'All content changes pushed successfully.';

  vscode.window.showInformationMessage(message);
};

export const pushContent =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: PushContentProps): Promise<void> => {
    const { fileMetadata, type, children } = await getPushProps(props, fsProvider);

    if (type === 'field') {
      await pushSingleField(fileMetadata, fsProvider);
      return;
    }

    if (type === 'content') {
      await pushMultipleFields(children, fsProvider);
      return;
    }
  };
