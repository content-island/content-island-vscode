import * as vscode from 'vscode';
import type { FileMetadata } from '../file-system';

export type TreeItemType = 'project' | 'content' | 'field';

export type ViewItem =
  | 'project'
  | 'content'
  | 'content-pull'
  | 'content-push'
  | 'content-pull-push'
  | 'field'
  | 'field-pull'
  | 'field-push'
  | 'field-pull-push';

export interface BaseTreeItem {
  label: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  type: TreeItemType;
  viewItem: ViewItem;
  description: string;
  tooltip: vscode.MarkdownString;
}

export interface ProjectTreeItem extends BaseTreeItem {
  type: 'project';
  projectId: string;
}

export interface ContentTreeItem extends BaseTreeItem {
  type: 'content';
  projectId: string;
  contentId: string;
}

export interface FieldTreeItem extends BaseTreeItem {
  type: 'field';
  fileMetadata: FileMetadata;
}
export type TreeItem = ProjectTreeItem | ContentTreeItem | FieldTreeItem;

export type GroupedFileMetadata = Map<string, { [contentId: string]: FileMetadata[] }>;
