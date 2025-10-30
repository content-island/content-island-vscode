import { getClient } from '#core/api.client';
import type { ContentIslandFileSystemProvider } from '#providers/file-system';
import type { ContentIslandTreeItem } from '#providers/tree';
import * as vscode from 'vscode';

export interface PullContentByIds {
  contentId: string;
  fieldId?: string;
  fieldIds?: string[];
}

export type PullContentProps = PullContentByIds | ContentIslandTreeItem;

const getPullContentIdsFromProps = async (props: PullContentProps): Promise<PullContentByIds> => {
  if ('contentId' in props && 'fieldId' in props) {
    return {
      contentId: props.contentId,
      fieldId: props.fieldId,
    };
  } else if ('treeItem' in props) {
    if (props.treeItem.type === 'field') {
      await getClient().authorizeByProjectId(props.fileMetadata.project.id);
      return {
        contentId: props.fileMetadata.content.id,
        fieldId: props.fileMetadata.field.id,
      };
    } else if (props.treeItem.type === 'content') {
      await getClient().authorizeByProjectId(props.treeItem.projectId);
      const fieldIds = props.children
        .filter(child => child.treeItem.type === 'field')
        .map(child => child.fileMetadata.field.id);
      return {
        contentId: props.treeItem.contentId,
        fieldIds,
      };
    }
  } else {
    throw new Error('Invalid properties provided to pull content.');
  }
};

const pullOneField = async (
  contentId: string,
  fieldId: string,
  fsProvider: ContentIslandFileSystemProvider
): Promise<void> => {
  const apiClient = getClient();

  const project = await apiClient.getProject();
  const content = await apiClient.getRawContent({ id: contentId });
  const field = content.fields.find(f => f.id === fieldId);

  if (!field) {
    throw new Error(`Field with ID ${fieldId} not found in content ${contentId}.`);
  }
  const uri = await fsProvider.setFileMetadata({
    project: {
      id: project.id,
      name: project.name,
    },
    content: {
      id: content.id,
      name: content.name,
    },
    field: {
      id: field.id,
      name: field.name,
      language: field.language,
    },
    pendingToPush: false,
    pendingToPull: false,
  });

  await fsProvider.writeFile(uri, Buffer.from(field.value, 'utf-8'), {
    create: true,
    overwrite: true,
    pendingToPush: false,
  });

  await fsProvider.openInEditor(uri);
};

const pullMultipleFields = async (
  contentId: string,
  fieldIds: string[],
  fsProvider: ContentIslandFileSystemProvider
): Promise<void> => {
  for (const fieldId of fieldIds) {
    await pullOneField(contentId, fieldId, fsProvider);
  }
};

export const pullContent =
  (fsProvider: ContentIslandFileSystemProvider) =>
  async (props: PullContentProps): Promise<void> => {
    const { contentId, fieldId, fieldIds } = await getPullContentIdsFromProps(props);

    if (fieldId) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pulling content...`,
          cancellable: false,
        },
        async () => {
          await pullOneField(contentId, fieldId, fsProvider);
        }
      );
    } else if (Array.isArray(fieldIds) && fieldIds.length > 0) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pulling all contents...`,
          cancellable: false,
        },
        async () => {
          await pullMultipleFields(contentId, fieldIds, fsProvider);
        }
      );
    } else {
      throw new Error('Either fieldId or fieldIds must be provided to pull content.');
    }
  };
