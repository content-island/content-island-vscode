import { deleteFile, discard, openFile, pullContent, pushContent, refresh } from '#commands';
import { getClient } from '#core/api.client';
import { COMMANDS } from '#core/constants';
import { ContentIslandFileSystemProvider, onSubscribeFileProvider } from '#providers/file-system';
import { ContentIslandTreeProvider, onSubscribeTreeProvider } from '#providers/tree';
import { onOpenVSCodeURI } from '#subscribers';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  getClient().setVSCodeExtensionContext(context);

  const fsProvider = new ContentIslandFileSystemProvider(context);
  context.subscriptions.push(onSubscribeFileProvider(fsProvider));
  const treeProvider = new ContentIslandTreeProvider(fsProvider);
  const treeView = onSubscribeTreeProvider(treeProvider);
  context.subscriptions.push(treeView);

  const commands = [
    vscode.commands.registerCommand(COMMANDS.REFRESH_TREE, refresh(fsProvider)),
    vscode.commands.registerCommand(COMMANDS.OPEN_FILE, openFile(fsProvider)),
    vscode.commands.registerCommand(COMMANDS.DELETE_FILE, deleteFile(fsProvider)),
    vscode.commands.registerCommand(COMMANDS.PULL_CONTENT, pullContent(fsProvider)),
    vscode.commands.registerCommand(COMMANDS.PUSH_CONTENT, pushContent(fsProvider)),
    vscode.commands.registerCommand(COMMANDS.DISCARD, discard(fsProvider)),
  ];
  commands.forEach(command => context.subscriptions.push(command));

  context.subscriptions.push(vscode.window.registerUriHandler({ handleUri: onOpenVSCodeURI }));
}

export async function deactivate() {
  console.log('Content Island VSCode extension deactivated');
}
