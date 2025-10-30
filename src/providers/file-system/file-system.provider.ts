import { EXTENSION_NAME, FILE_RESOURCE_SCHEME } from '#core/constants';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as vscode from 'vscode';
import { METADATA_JSON_FILENAME } from './file-system.constants';
import * as model from './file-system.model';

export class ContentIslandFileSystemProvider implements vscode.FileSystemProvider {
  private _fileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._fileEventEmitter.event;
  private _metadataEventEmitter = new vscode.EventEmitter<void>();
  readonly onMetadataChange: vscode.Event<void> = this._metadataEventEmitter.event;

  private _workspaceRoot: string;
  private _metadataFilePath: string;
  private _fileMetadataMap: Map<string, model.FileMetadata> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this._workspaceRoot = path.join(context.globalStorageUri.fsPath, EXTENSION_NAME);
    this._metadataFilePath = path.join(this._workspaceRoot, METADATA_JSON_FILENAME);
    this._loadMetadata();
  }

  private async _loadMetadata(): Promise<void> {
    try {
      await fs.mkdir(this._workspaceRoot, { recursive: true });
      const data = await fs.readFile(this._metadataFilePath, 'utf-8');
      const obj = JSON.parse(data);
      this._fileMetadataMap = new Map(Object.entries(obj));
      this._metadataEventEmitter.fire();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async _saveMetadata(): Promise<void> {
    const data = Object.fromEntries(this._fileMetadataMap);
    await fs.writeFile(this._metadataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    this._metadataEventEmitter.fire();
  }

  public get fileMetadataList(): model.FileMetadata[] {
    return Array.from(this._fileMetadataMap.values());
  }

  public getFileMetadata(uri: vscode.Uri): model.FileMetadata | undefined {
    return this._fileMetadataMap.get(uri.toString());
  }

  private _formatFilePath(fileMetadata: model.FileMetadata): string {
    return path.join(
      this._workspaceRoot,
      fileMetadata.project.id,
      fileMetadata.content.id,
      fileMetadata.field.language,
      `${fileMetadata.field.name}.md`
    );
  }

  public getUri(fileMetadata: model.FileMetadata): vscode.Uri {
    const filePath = this._formatFilePath(fileMetadata);
    return vscode.Uri.file(filePath).with({ scheme: FILE_RESOURCE_SCHEME });
  }

  public async setFileMetadata(fileMetadata: model.FileMetadata, uri?: vscode.Uri): Promise<vscode.Uri> {
    const currentURI = uri ?? this.getUri(fileMetadata);
    const currentFilePath = currentURI.fsPath;
    const newFilePath = this._formatFilePath(fileMetadata);

    let newURI = currentURI;
    if (currentFilePath !== newFilePath) {
      await this.rename(currentURI, vscode.Uri.file(newFilePath), { overwrite: true });

      newURI = this.getUri(fileMetadata);
    }

    this._fileMetadataMap.set(newURI.toString(), fileMetadata);
    await this._saveMetadata();
    return newURI;
  }

  public async openInEditor(uri: vscode.Uri): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
  }

  public async openInEditorByFileMetadata(fileMetadata: model.FileMetadata): Promise<void> {
    const uri = this.getUri(fileMetadata);
    await this.openInEditor(uri);
  }

  watch(
    uri: vscode.Uri,
    options: { readonly recursive: boolean; readonly excludes: readonly string[] }
  ): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    try {
      const stats = await fs.stat(uri.fsPath);
      return {
        type: stats.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File,
        ctime: stats.ctimeMs,
        mtime: stats.mtimeMs,
        size: stats.size,
      };
    } catch {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const entries = await fs.readdir(uri.fsPath, { withFileTypes: true });
    return entries.map(entry => [entry.name, entry.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File]);
  }

  async createDirectory(uri: vscode.Uri): Promise<void> {
    await fs.mkdir(uri.fsPath, { recursive: true });
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    try {
      return await fs.readFile(uri.fsPath);
    } catch {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean; pendingToPush?: boolean }
  ): Promise<void> {
    const exists = existsSync(uri.fsPath);

    if (!exists && !options.create) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    if (exists && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });

    const pendingToPush = options.pendingToPush !== undefined ? options.pendingToPush : true;
    if (exists) {
      const metadata = this._fileMetadataMap.get(uri.toString());
      if (metadata) {
        metadata.pendingToPush = pendingToPush;
        this._fileMetadataMap.set(uri.toString(), metadata);
        await this._saveMetadata();
      }
    }

    await fs.writeFile(uri.fsPath, content);
    this._fileEventEmitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
  }

  async delete(uri: vscode.Uri): Promise<void> {
    this._fileMetadataMap.delete(uri.toString());
    await this._saveMetadata();
    try {
      await fs.unlink(uri.fsPath);
      this._fileEventEmitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
    } catch {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): Promise<void> {
    const destExists = existsSync(newUri.fsPath);
    if (destExists && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(newUri);
    }
    await fs.rename(oldUri.fsPath, newUri.fsPath);

    const metadata = this._fileMetadataMap.get(oldUri.toString());
    if (metadata) {
      this._fileMetadataMap.delete(oldUri.toString());
      this._fileMetadataMap.set(newUri.toString(), metadata);
      await this._saveMetadata();
    }

    this._fileEventEmitter.fire([
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri },
    ]);
  }
}

export const onSubscribeFileProvider = (provider: ContentIslandFileSystemProvider): vscode.Disposable => {
  return vscode.workspace.registerFileSystemProvider(FILE_RESOURCE_SCHEME, provider, {
    isCaseSensitive: true,
    isReadonly: false,
  });
};
