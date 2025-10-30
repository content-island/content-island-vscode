import type { ContentIslandFileSystemProvider, FileMetadata } from '#providers/file-system';
import type { ContentIslandTreeItem } from '#providers/tree';

export type OpenFileProps =
  | ContentIslandTreeItem
  | {
      fileMetadata: FileMetadata;
    };

export const openFile =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: OpenFileProps): Promise<void> => {
    const { fileMetadata } = props;
    if (!fileMetadata) {
      throw new Error('Cannot open file: file metadata is missing.');
    }
    await fsProvider.openInEditorByFileMetadata(fileMetadata);
  };
