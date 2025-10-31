import type { FileMetadata, GroupedFileMetadata } from '#providers/file-system';

export const mapToGroupedFileMetadata = (fileMetadataList: FileMetadata[]): GroupedFileMetadata => {
  const groupedMap: GroupedFileMetadata = new Map();

  fileMetadataList?.forEach(fileMetadata => {
    const projectId = fileMetadata.project.id;
    const contentId = fileMetadata.content.id;
    if (!groupedMap.has(projectId)) {
      groupedMap.set(projectId, {});
    }
    const contentMap = groupedMap.get(projectId);
    if (!contentMap[contentId]) {
      contentMap[contentId] = [];
    }
    contentMap[contentId].push(fileMetadata);
  });

  return groupedMap;
};
