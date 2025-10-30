import type { FileMetadata } from '../file-system';
import {
  mapToContentTreeItemList,
  mapToFieldTreeItemList,
  mapToGroupedFileMetadata,
  mapToProjectTreeItemList,
} from './tree.mappers';

let appendMarkdownSpy;
vi.mock('vscode', () => {
  return {
    TreeItemCollapsibleState: {
      Collapsed: 1,
      Expanded: 2,
      None: 0,
    },
    MarkdownString: class {
      constructor() {}
      appendMarkdown = appendMarkdownSpy;
    },
  };
});

describe('mapToGroupedFileMetadata', () => {
  it.each<{ fieldMetadataList: FileMetadata[] }>([
    {
      fieldMetadataList: undefined,
    },
    {
      fieldMetadataList: null,
    },
    {
      fieldMetadataList: [],
    },
  ])('should return an empty map when input is $fieldMetadataList', ({ fieldMetadataList }) => {
    // Arrange

    // Act
    const grouped = mapToGroupedFileMetadata(fieldMetadataList as any);

    // Assert
    expect(grouped.size).toEqual(0);
  });

  it('should group file metadata by project ID and content ID', () => {
    // Arrange
    const fileMetadataList: FileMetadata[] = [
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: {
          id: 'field1',
          name: 'Field 1',
          language: 'en',
        },
        pendingToPull: false,
        pendingToPush: false,
      },
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: {
          id: 'field2',
          name: 'Field 2',
          language: 'en',
        },
        pendingToPull: true,
        pendingToPush: false,
      },
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content2', name: 'Content 2' },
        field: {
          id: 'field3',
          name: 'Field 3',
          language: 'en',
        },
        pendingToPull: false,
        pendingToPush: true,
      },
      {
        project: { id: 'project2', name: 'Project 2' },
        content: { id: 'content3', name: 'Content 3' },
        field: {
          id: 'field4',
          name: 'Field 4',
          language: 'en',
        },
        pendingToPull: true,
        pendingToPush: true,
      },
    ];

    // Act
    const grouped = mapToGroupedFileMetadata(fileMetadataList);

    // Assert
    expect(grouped.size).toBe(2);
    expect(grouped.get('project1')).toBeDefined();
    expect(grouped.get('project2')).toBeDefined();

    const project1ContentMap = grouped.get('project1')!;
    expect(Object.keys(project1ContentMap).length).toBe(2);
    expect(project1ContentMap['content1'].length).toBe(2);
    expect(project1ContentMap['content2'].length).toBe(1);

    const project2ContentMap = grouped.get('project2')!;
    expect(Object.keys(project2ContentMap).length).toBe(1);
    expect(project2ContentMap['content3'].length).toBe(1);
  });
});

describe('mapToProjectTreeItemList', () => {
  beforeEach(() => {
    appendMarkdownSpy = vi.fn();
  });

  it('should map grouped file metadata to project tree items', () => {
    // Arrange
    const groupedFileMetadata = new Map<string, any>();
    groupedFileMetadata.set('project1', {
      content1: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content1', name: 'Content 1' },
          field: { id: 'field1', name: 'Field 1', language: 'en' },
          pendingToPull: true,
          pendingToPush: false,
        },
      ],
      content2: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content2', name: 'Content 2' },
          field: { id: 'field2', name: 'Field 2', language: 'en' },
          pendingToPull: false,
          pendingToPush: true,
        },
      ],
    });
    groupedFileMetadata.set('project2', {
      content3: [
        {
          project: { id: 'project2', name: 'Project 2' },
          content: { id: 'content3', name: 'Content 3' },
          field: { id: 'field3', name: 'Field 3', language: 'en' },
          pendingToPull: false,
          pendingToPush: false,
        },
      ],
    });

    // Act
    const projectTreeItems = mapToProjectTreeItemList(groupedFileMetadata);

    // Assert
    expect(projectTreeItems.length).toEqual(2);
    expect(projectTreeItems[0]).toEqual({
      label: 'Project 1',
      collapsibleState: 1,
      type: 'project',
      viewItem: 'project',
      description: '⬇• 2 contents',
      tooltip: expect.any(Object),
      projectId: 'project1',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(1, '**Project:** Project 1\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(2, '⚠️ Has pending changes to *pull*\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(3, '⚠️ Has pending changes to *push*\n\n');

    expect(projectTreeItems[1]).toEqual({
      label: 'Project 2',
      collapsibleState: 1,
      type: 'project',
      viewItem: 'project',
      description: '1 content',
      tooltip: expect.any(Object),
      projectId: 'project2',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(4, '**Project:** Project 2\n\n');
    expect(appendMarkdownSpy).toHaveBeenCalledTimes(4);
  });

  it('should handle empty grouped file metadata', () => {
    // Arrange
    const groupedFileMetadata = new Map<string, any>();

    // Act
    const projectTreeItems = mapToProjectTreeItemList(groupedFileMetadata);

    // Assert
    expect(projectTreeItems.length).toEqual(0);
  });
});

describe('mapToContentTreeItemList', () => {
  beforeEach(() => {
    appendMarkdownSpy = vi.fn();
  });
  it('should map grouped file metadata to content tree items', () => {
    // Arrange
    const groupedFileMetadata = new Map<string, any>();
    groupedFileMetadata.set('project1', {
      content1: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content1', name: 'Content 1' },
          field: { id: 'field1', name: 'Field 1', language: 'en' },
          pendingToPull: true,
          pendingToPush: false,
        },
      ],
      content2: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content2', name: 'Content 2' },
          field: { id: 'field2', name: 'Field 2', language: 'en' },
          pendingToPull: false,
          pendingToPush: true,
        },
      ],
      content3: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content3', name: 'Content 3' },
          field: { id: 'field3', name: 'Field 3', language: 'en' },
          pendingToPull: false,
          pendingToPush: false,
        },
      ],
      content4: [
        {
          project: { id: 'project1', name: 'Project 1' },
          content: { id: 'content4', name: 'Content 4' },
          field: { id: 'field4', name: 'Field 4', language: 'en' },
          pendingToPull: true,
          pendingToPush: true,
        },
      ],
    });
    const projectId = 'project1';

    // Act
    const contentTreeItems = mapToContentTreeItemList(groupedFileMetadata, projectId);

    // Assert
    expect(contentTreeItems.length).toEqual(4);
    expect(contentTreeItems[0]).toEqual({
      label: 'Content 1',
      collapsibleState: 1,
      type: 'content',
      viewItem: 'content-pull',
      description: '⬇ 1 field',
      tooltip: expect.any(Object),
      projectId: 'project1',
      contentId: 'content1',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(1, '**Content:** Content 1\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(2, '⚠️ Has pending changes to *pull*\n\n');

    expect(contentTreeItems[1]).toEqual({
      label: 'Content 2',
      collapsibleState: 1,
      type: 'content',
      viewItem: 'content-push',
      description: '• 1 field',
      tooltip: expect.any(Object),
      projectId: 'project1',
      contentId: 'content2',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(3, '**Content:** Content 2\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(4, '⚠️ Has pending changes to *push*\n\n');

    expect(contentTreeItems[2]).toEqual({
      label: 'Content 3',
      collapsibleState: 1,
      type: 'content',
      viewItem: 'content',
      description: '1 field',
      tooltip: expect.any(Object),
      projectId: 'project1',
      contentId: 'content3',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(5, '**Content:** Content 3\n\n');

    expect(contentTreeItems[3]).toEqual({
      label: 'Content 4',
      collapsibleState: 1,
      type: 'content',
      viewItem: 'content-pull-push',
      description: '⬇• 1 field',
      tooltip: expect.any(Object),
      projectId: 'project1',
      contentId: 'content4',
    });
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(6, '**Content:** Content 4\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(7, '⚠️ Has pending changes to *pull*\n\n');
    expect(appendMarkdownSpy).toHaveBeenNthCalledWith(8, '⚠️ Has pending changes to *push*\n\n');

    expect(appendMarkdownSpy).toHaveBeenCalledTimes(8);
  });
});

describe('mapToFieldTreeItemList', () => {
  beforeEach(() => {
    appendMarkdownSpy = vi.fn();
  });
  it('should map grouped file metadata to field tree items', () => {
    // Arrange
    const fileMetadataList = [
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: { id: 'field1', name: 'Field 1', language: 'en' },
        pendingToPull: true,
        pendingToPush: false,
      },
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: { id: 'field2', name: 'Field 2', language: 'en' },
        pendingToPull: false,
        pendingToPush: true,
      },
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: { id: 'field3', name: 'Field 3', language: 'en' },
        pendingToPull: false,
        pendingToPush: false,
      },
      {
        project: { id: 'project1', name: 'Project 1' },
        content: { id: 'content1', name: 'Content 1' },
        field: { id: 'field4', name: 'Field 4', language: 'en' },
        pendingToPull: true,
        pendingToPush: true,
      },
    ];
    const groupedFileMetadata = new Map<string, any>();
    groupedFileMetadata.set('project1', {
      content1: fileMetadataList,
    });
    const projectId = 'project1';
    const contentId = 'content1';

    // Act
    const fieldTreeItems = mapToFieldTreeItemList(groupedFileMetadata, projectId, contentId);

    // Assert
    expect(fieldTreeItems.length).toEqual(4);
    expect(fieldTreeItems[0]).toEqual({
      label: '[en] Field 1',
      collapsibleState: 0,
      type: 'field',
      viewItem: 'field-pull',
      description: '⬇',
      tooltip: expect.any(Object),
      fileMetadata: fileMetadataList[0],
    });
    expect(fieldTreeItems[1]).toEqual({
      label: '[en] Field 2',
      collapsibleState: 0,
      type: 'field',
      viewItem: 'field-push',
      description: '• Modified',
      tooltip: expect.any(Object),
      fileMetadata: fileMetadataList[1],
    });
    expect(fieldTreeItems[2]).toEqual({
      label: '[en] Field 3',
      collapsibleState: 0,
      type: 'field',
      viewItem: 'field',
      description: '',
      tooltip: expect.any(Object),
      fileMetadata: fileMetadataList[2],
    });
    expect(fieldTreeItems[3]).toEqual({
      label: '[en] Field 4',
      collapsibleState: 0,
      type: 'field',
      viewItem: 'field-pull-push',
      description: '⬇• Modified',
      tooltip: expect.any(Object),
      fileMetadata: fileMetadataList[3],
    });
  });
});
