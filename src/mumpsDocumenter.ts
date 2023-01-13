import * as vscode from 'vscode';
const DIVIDERLINE = "\t;****************\n"

export default function mumpsDocumenter() {
	let editor = vscode.window.activeTextEditor
	if (editor) {
		let document = editor.document
		let InsertPosition = editor.selection.start.with(editor.selection.start.line, 0)

		//if the line is empty look down for the label
		while (InsertPosition.line < document.lineCount) {
			let txt = editor.document.lineAt(InsertPosition.line).text
			if (txt.replace(/\t|\ /ig, "") === "") {
				InsertPosition = InsertPosition.translate(1, 0)
			} else {
				break;
			}
		}
		if (InsertPosition.line === document.lineCount) {
			InsertPosition = InsertPosition.translate(-1, 0)
		}
		//start moving up the file looking for the label header
		while (InsertPosition.line >= 0) {
			let text = editor.document.lineAt(InsertPosition.line).text
			if (!(text.length === 0 || text.charAt(0) === " " || text.charAt(0) === '\t' || text.charAt(0) === ';')) {
				editor.edit((editBuilder) => {
					editBuilder.insert(InsertPosition, makeSignature(text))
				})
				break;
			} else {
				InsertPosition = InsertPosition.translate(-1, 0)
			}
		}
	}
};


function makeSignature(labelLine: string) {
	let Signature = ""
	let parameterString: string[] = [];
	Signature += DIVIDERLINE
	Signature += "\t; DESCRIPTION: \n"
	let parameters = labelLine.match(/\(.*\)/);
	if (parameters !== null && parameters.length > 0) {
		parameterString = parameters[0].toString().substring(1, parameters[0].toString().length - 1).split(",")
		if (parameterString.length > 0) {
			Signature += "\t; PARAMETERS: \n"
			parameterString.forEach(function (element: string) {
				Signature += "\t;    " + element + ": \n"
			});
		}
	}

	Signature += "\t; RETURNS: \n"
	Signature += "\t; REVISIONS: \n"
	Signature += DIVIDERLINE
	return Signature;
}

