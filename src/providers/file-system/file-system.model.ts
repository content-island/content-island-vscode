export interface FileMetadata {
  project: {
    id: string;
    name: string;
  };
  content: {
    id: string;
    name: string;
  };
  field: {
    id: string;
    name: string;
    language: string;
  };
  pendingToPush: boolean;
  pendingToPull: boolean;
}
