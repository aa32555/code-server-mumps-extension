'use strict';

import * as vscode from 'vscode';
import { autoSpaceEnter, autoSpaceTab } from './mumpsAutospace';
import { MumpsHighlighter, SemanticTokens } from './mumpsHighlighter';
import MumpsConfigurationProvider from './mumpsConfigurationProvider';
import MumpsDebugSession from './mumpsDebug';
import MumpsDocumentSymbolProvider from './mumpsDocumentSymbolProvider';
import MumpsDefinitionProvider from './mumpsDefinitionProvider';
import MumpsEvalutableExpressionProvider from './mumpsEvalutableExpressionProvider';
import MumpsFormattingHelpProvider from './mumpsFormattingHelpProvider';
import MumpsHoverProvider from './mumpsHoverProvider';
import MumpsReferenceProvider from './mumpsReferenceProvider';
import MumpsSignatureHelpProvider from './mumpsSignatureHelpProvider';
import MumpsDocumenter from './mumpsDocumenter';
import CompletionItemProvider from './mumpsCompletionItemProvider';
import expandCompress from './mumpsCompExp';
import MumpsDiagnosticsProvider from './mumpsDiagnosticsProvider';
import { MumpsGlobalProvider, GlobalNode } from './mumpsGlobalProvider';
import fs = require('fs');
let timeout: ReturnType<typeof setTimeout> | undefined;
const entryRef: string | undefined = "";
let dbFile = "";
let localRoutinesPath = "";
const globalDirectoryProvider = MumpsGlobalProvider.getInstance();
export async function activate(context: vscode.ExtensionContext) {
	const MUMPS_MODE: vscode.DocumentFilter = { language: 'mumps', scheme: 'file' };
	// register a configuration provider for 'mumps' debug type
	const mumpsDiagnostics = vscode.languages.createDiagnosticCollection("mumps");
	let storage = "";
	if (context.storageUri !== undefined) {
		storage = context.storageUri.fsPath;
		if (!fs.existsSync(storage)) {
			fs.mkdirSync(storage);
		}
		dbFile = storage + "/labeldb.json";
		context.subscriptions.push(vscode.languages.registerCompletionItemProvider(MUMPS_MODE, new CompletionItemProvider(dbFile)));
	}
	const wsState = context.workspaceState;
	context.subscriptions.push(
		vscode.commands.registerCommand("mumps.documentFunction", () => { MumpsDocumenter(); }),
		vscode.commands.registerCommand("mumps.autoSpaceEnter", () => { autoSpaceEnter(); }),
		vscode.commands.registerCommand("mumps.autoSpaceTab", () => { autoSpaceTab(); }),
		vscode.commands.registerCommand("mumps.toggleExpandedCommands", () => { expandCompress(wsState) }),
		vscode.commands.registerCommand('mumps.getEntryRef', () => { return getEntryRef() }),
		vscode.commands.registerCommand('mumps.Globals.loadMore', (node: GlobalNode) => globalDirectoryProvider.getMoreNodes(node)),
		vscode.commands.registerCommand('mumps.Globals.refresh', () => MumpsGlobalProvider.refresh()),
		vscode.commands.registerCommand('mumps.Globals.search', (node: GlobalNode) => globalDirectoryProvider.search(node)),
		vscode.debug.registerDebugConfigurationProvider('mumps', new MumpsConfigurationProvider()),
		vscode.debug.registerDebugAdapterDescriptorFactory('mumps', new InlineDebugAdapterFactory()),
		vscode.debug.onDidStartDebugSession((session) => {
			// Check if it's a MUMPS debug session
			if (session.type === 'mumps') {
				//globalDirectoryProvider.showView(); // Show the Global Directory view
			}
		}),
		vscode.languages.registerHoverProvider(MUMPS_MODE, new MumpsHoverProvider()),
		vscode.languages.registerDefinitionProvider(MUMPS_MODE, new MumpsDefinitionProvider()),
		vscode.languages.registerEvaluatableExpressionProvider(MUMPS_MODE, new MumpsEvalutableExpressionProvider()),
		vscode.languages.registerSignatureHelpProvider(MUMPS_MODE, new MumpsSignatureHelpProvider(), '(', ','),
		vscode.languages.registerDocumentSymbolProvider(MUMPS_MODE, new MumpsDocumentSymbolProvider()),
		vscode.languages.registerDocumentSemanticTokensProvider(MUMPS_MODE, MumpsHighlighter, SemanticTokens),
		vscode.languages.registerDocumentFormattingEditProvider(MUMPS_MODE, new MumpsFormattingHelpProvider()),
		vscode.languages.registerDocumentRangeFormattingEditProvider(MUMPS_MODE, new MumpsFormattingHelpProvider()),
		vscode.languages.registerReferenceProvider(MUMPS_MODE, new MumpsReferenceProvider()),
		vscode.window.registerTreeDataProvider('mumpsGlobals', MumpsGlobalProvider.getInstance()),
		vscode.window.onDidChangeActiveTextEditor(editor => { if (editor) { triggerUpdateDiagnostics(editor.document, mumpsDiagnostics) } }),
		vscode.workspace.onDidChangeTextDocument(editor => { if (editor) { triggerUpdateDiagnostics(editor.document, mumpsDiagnostics) } }),
		vscode.workspace.onDidOpenTextDocument(document => { triggerUpdateDiagnostics(document, mumpsDiagnostics) }),
	);
}

export function deactivate() {
	// nothing to do
}

class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

	createDebugAdapterDescriptor(): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
		return new vscode.DebugAdapterInlineImplementation(new MumpsDebugSession());
	}
}

function triggerUpdateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	timeout = setTimeout(() => new MumpsDiagnosticsProvider(document, collection), 500);
}

function getEntryRef() {
	return vscode.window.showInputBox({
		placeHolder: "Please enter the Entry-Reference to start Debugging",
		value: entryRef
	})
}

export function getdbFile() {
	return dbFile;
}

export function getWworkspaceFolder() {
	return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
}
export function getLocalRoutinesPath() {
	return localRoutinesPath;
}
export function setLocalRoutinesPath(path: string) {
	localRoutinesPath = path;
}
