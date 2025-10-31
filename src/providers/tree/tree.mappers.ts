import * as vscode from 'vscode';
import type { FileMetadata, GroupedFileMetadata } from '../file-system';
import {
  PENDING_TO_PULL_ICON,
  PENDING_TO_PULL_TOOLTIP,
  PENDING_TO_PUSH_ICON,
  PENDING_TO_PUSH_TOOLTIP,
} from './tree.constants';
import * as model from './tree.model';

const getStatusIcons = (pendingToPull: boolean, pendingToPush: boolean): string => {
  const statusIcons = `${pendingToPull ? PENDING_TO_PULL_ICON : ''}${pendingToPush ? PENDING_TO_PUSH_ICON : ''}`.trim();
  return statusIcons ? `${statusIcons} ` : '';
};

const getDescription = (label: string, length: number, pendingToPull: boolean, pendingToPush: boolean): string => {
  const statusIcons = getStatusIcons(pendingToPull, pendingToPush);
  return `${statusIcons}${length} ${label}${length > 1 ? 's' : ''}`;
};

const getTooltip = (title: string, pendingToPull: boolean, pendingToPush: boolean): vscode.MarkdownString => {
  const tooltip = new vscode.MarkdownString();
  tooltip.appendMarkdown(title);
  if (pendingToPull) {
    tooltip.appendMarkdown(PENDING_TO_PULL_TOOLTIP);
  }
  if (pendingToPush) {
    tooltip.appendMarkdown(PENDING_TO_PUSH_TOOLTIP);
  }
  return tooltip;
};

const mapToProjectTreeItem = (
  projectId: string,
  contentMap: { [contentId: string]: FileMetadata[] }
): model.ProjectTreeItem => {
  const fileMetadataList: FileMetadata[] = Object.values(contentMap).flat();
  const firstFileMetadata = fileMetadataList[0];
  const project = firstFileMetadata.project;
  const contentIdsLenght = Object.keys(contentMap)?.length;
  const pendingToPull = fileMetadataList.some(fileMetadata => fileMetadata.pendingToPull);
  const pendingToPush = fileMetadataList.some(fileMetadata => fileMetadata.pendingToPush);

  return {
    label: project.name,
    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    type: 'project',
    viewItem: 'project',
    description: getDescription('content', contentIdsLenght, pendingToPull, pendingToPush),
    tooltip: getTooltip(`**Project:** ${project.name}\n\n`, pendingToPull, pendingToPush),
    projectId,
  };
};

export const mapToProjectTreeItemList = (groupedFileMetadata: GroupedFileMetadata): model.ProjectTreeItem[] => {
  const projectTreeItems: model.ProjectTreeItem[] = [];
  groupedFileMetadata.forEach((contentMap, projectId) => {
    projectTreeItems.push(mapToProjectTreeItem(projectId, contentMap));
  });

  return projectTreeItems;
};

const mapToContentTreeItem = (
  fileMetadataList: FileMetadata[],
  projectId: string,
  contentId: string
): model.ContentTreeItem => {
  const firstFileMetadata = fileMetadataList[0];
  const content = firstFileMetadata.content;
  const fieldIdsLenght = fileMetadataList.length;
  const pendingToPull = fileMetadataList.some(fileMetadata => fileMetadata.pendingToPull);
  const pendingToPush = fileMetadataList.some(fileMetadata => fileMetadata.pendingToPush);

  return {
    label: content.name,
    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    type: 'content',
    viewItem: `content${pendingToPull ? '-pull' : ''}${pendingToPush ? '-push' : ''}`,
    description: getDescription('field', fieldIdsLenght, pendingToPull, pendingToPush),
    tooltip: getTooltip(`**Content:** ${content.name}\n\n`, pendingToPull, pendingToPush),
    projectId,
    contentId,
  };
};

export const mapToContentTreeItemList = (
  groupedFileMetadata: GroupedFileMetadata,
  projectId: string
): model.ContentTreeItem[] => {
  const contentTreeItems: model.ContentTreeItem[] = [];
  const contentMap = groupedFileMetadata.get(projectId);
  if (contentMap) {
    Object.entries(contentMap).forEach(([contentId, fileMetadataList]) => {
      contentTreeItems.push(mapToContentTreeItem(fileMetadataList, projectId, contentId));
    });
  }

  return contentTreeItems;
};

const mapToFieldTreeItem = (fileMetadata: FileMetadata): model.FieldTreeItem => {
  const field = fileMetadata.field;
  const description =
    `${getStatusIcons(fileMetadata.pendingToPull, fileMetadata.pendingToPush)}${fileMetadata.pendingToPush ? 'Modified' : ''}`.trim();
  const label = `[${field.language}] ${field.name}`;
  return {
    label,
    collapsibleState: vscode.TreeItemCollapsibleState.None,
    type: 'field',
    viewItem: `field${fileMetadata.pendingToPull ? '-pull' : ''}${fileMetadata.pendingToPush ? '-push' : ''}`,
    description,
    tooltip: getTooltip(`**Field:** ${label}\n\n`, fileMetadata.pendingToPull, fileMetadata.pendingToPush),
    fileMetadata,
  };
};

export const mapToFieldTreeItemList = (
  groupedFileMetadata: GroupedFileMetadata,
  projectId: string,
  contentId: string
): model.FieldTreeItem[] => {
  const fieldTreeItems: model.FieldTreeItem[] = [];
  const contentMap = groupedFileMetadata.get(projectId);
  if (contentMap) {
    const fileMetadataList = contentMap[contentId];
    fileMetadataList.forEach(fileMetadata => {
      fieldTreeItems.push(mapToFieldTreeItem(fileMetadata));
    });
  }

  return fieldTreeItems;
};
