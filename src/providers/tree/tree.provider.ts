import type { OpenFileProps } from '#commands';
import { sortByString } from '#common/helpers/sort.helpers.js';
import { COMMANDS, EXPLORER_VIEW_ID } from '#core/constants';
import { mapToGroupedFileMetadata } from '#core/mappers';
import * as vscode from 'vscode';
import type { ContentIslandFileSystemProvider, FileMetadata } from '../file-system';
import { mapToContentTreeItemList, mapToFieldTreeItemList, mapToProjectTreeItemList } from './tree.mappers';
import * as model from './tree.model';

export class ContentIslandTreeItem extends vscode.TreeItem {
  public readonly fileMetadata?: FileMetadata;
  constructor(
    public readonly treeItem: model.TreeItem,
    public readonly children?: ContentIslandTreeItem[]
  ) {
    super(treeItem.label, treeItem.collapsibleState);

    this.label = treeItem.label;
    this.contextValue = treeItem.viewItem;
    this.tooltip = treeItem.tooltip;
    this.description = treeItem.description;

    switch (treeItem.type) {
      case 'project':
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case 'content':
        this.iconPath = new vscode.ThemeIcon('symbol-interface');
        break;
      case 'field':
        this.iconPath = new vscode.ThemeIcon('symbol-field');
        const openFileProps: OpenFileProps = {
          fileMetadata: treeItem.fileMetadata,
        };
        this.fileMetadata = treeItem.fileMetadata;
        this.command = {
          command: COMMANDS.OPEN_FILE,
          title: 'Open File',
          arguments: [openFileProps],
        };
        break;
    }
  }
}

const buildTree = (fsProvider: ContentIslandFileSystemProvider): ContentIslandTreeItem[] => {
  const groupedFileMetadata = mapToGroupedFileMetadata(fsProvider.fileMetadataList);

  return mapToProjectTreeItemList(groupedFileMetadata)
    .map(
      project =>
        new ContentIslandTreeItem(
          project,
          mapToContentTreeItemList(groupedFileMetadata, project.projectId)
            .map(
              content =>
                new ContentIslandTreeItem(
                  content,
                  mapToFieldTreeItemList(groupedFileMetadata, content.projectId, content.contentId)
                    .map(item => new ContentIslandTreeItem(item))
                    .sort((a, b) => sortByString(a.label.toString(), b.label.toString()))
                )
            )
            .sort((a, b) => sortByString(a.label.toString(), b.label.toString()))
        )
    )
    .sort((a, b) => sortByString(a.label.toString(), b.label.toString()));
};

export class ContentIslandTreeProvider implements vscode.TreeDataProvider<ContentIslandTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ContentIslandTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private fsProvider: ContentIslandFileSystemProvider) {
    this.fsProvider.onDidChangeFile(() => {
      this.refresh();
    });
    this.fsProvider.onMetadataChange(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContentIslandTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: ContentIslandTreeItem): Promise<ContentIslandTreeItem[]> {
    if (!element) {
      return buildTree(this.fsProvider);
    }
    return element.children ?? [];
  }
}

export const onSubscribeTreeProvider = (
  provider: ContentIslandTreeProvider
): vscode.TreeView<ContentIslandTreeItem> => {
  const treeView = vscode.window.createTreeView(EXPLORER_VIEW_ID, {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  return treeView;
};
