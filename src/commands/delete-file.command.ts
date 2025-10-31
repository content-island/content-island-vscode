import type { ContentIslandFileSystemProvider } from '#providers/file-system';
import type { ContentIslandTreeItem } from '#providers/tree';
import * as vscode from 'vscode';

export type DeleteFileProps = ContentIslandTreeItem;

const confirmDelete = async (description: string): Promise<boolean> => {
  const answer = await vscode.window.showWarningMessage(description, { modal: true }, 'Delete');
  return answer === 'Delete';
};

export const deleteFile =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: DeleteFileProps): Promise<void> => {
    const { treeItem } = props;
    if (treeItem.type === 'field') {
      const fileMetadata = treeItem.fileMetadata;
      const confirmed = await confirmDelete(
        `Delete local copy of "[${fileMetadata.field.language}] ${fileMetadata.field.name}"?`
      );
      if (confirmed) {
        const uri = fsProvider.getUri(fileMetadata);
        await fsProvider.delete(uri);
      }
    } else if (treeItem.type === 'content') {
      const confirmed = await confirmDelete(`Delete all local files for content "${treeItem.label}"?`);
      if (confirmed) {
        const contentId = treeItem.contentId;
        const projectId = treeItem.projectId;
        const fileMetadataList = fsProvider.fileMetadataList.filter(
          fm => fm.project.id === projectId && fm.content.id === contentId
        );
        for (const fileMetadata of fileMetadataList) {
          const uri = fsProvider.getUri(fileMetadata);
          await fsProvider.delete(uri);
        }
      }
    }
  };
