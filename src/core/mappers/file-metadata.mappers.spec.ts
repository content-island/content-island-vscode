import type { FileMetadata } from '#providers/file-system';
import { mapToGroupedFileMetadata } from './file-metadata.mappers';

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
