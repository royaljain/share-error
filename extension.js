var firebase = require("firebase/app"); 
const firebaseConfig = require("./firebaseconfig.json");

const app = firebase.initializeApp(firebaseConfig)
const firestoreFile = require("firebase/firestore");
const db = firestoreFile.getFirestore(app);

const firebaseStorageFile = require("firebase/storage");
const storage = firebaseStorageFile.getStorage(app);



const vscode = require('vscode');
const path = require('path');
const fs = require('fs');



const bucketName = "discover-easy.appspot.com"



/*	
async function setCredentials(context, key, value){
	const secrets = context['secrets']; //SecretStorage-object
	return await secrets.store(key, value); //Save a secret
}

async function getCredentials(context, key){
	const secrets = context['secrets']; //SecretStorage-object
	return await secrets.get(key); //Save a secret
}

async function auth(context){
	getCredentials(context, "creds").then((resp) => {
		if(resp){
			console.log("Get", resp);
		}else{
			vscode.window.showInputBox({
				placeHolder: "Choose a username",
				prompt: "Username",
				value: "selectedText"
			}).then((username) => {
				vscode.window.showInputBox({
					placeHolder: "Choose a password",
					prompt: "Password",
					value: "selectedText"
				}).then((username) => {
					setCredentials(context, "credentials", {"user": username}).then(
					(resp) => {
						console.log("Set");
					}
				)
			})
		})
		}
	})
}
*/
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "share-error" is now active!');
	const pathToHtml = vscode.Uri.file(
		path.join(context.extensionPath, 'shareerrorform.html')
	);
	
	const pathUri = pathToHtml.with({scheme: 'vscode-resource'});
	



	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('share-error.shareError', function () {
		// The code you place here will be executed every time your command is executed

		//auth(context);

		const panel = vscode.window.createWebviewPanel(
			'ErrorForm', // Identifies the type of the webview. Used internally
			'Share Error', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				// Enable scripts in the webview
				enableScripts: true
			}
		);
	
		panel.webview.html = fs.readFileSync(pathUri.fsPath,'utf8');
		panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'submit':
					const msg = JSON.parse(message.text);
					const uid = msg["uid"]
					const workspaces = vscode.workspace.workspaceFolders;

					let metadata = {
						"errorDesc": msg["errorDesc"],
						"stackTrace": msg["stackTrace"]
					}	

					let files = {}

					msg["files"].forEach((fileUri) => {

						if (fs.existsSync(fileUri)) {
						
							let dest = "";
							let relPath = ""

							if(workspaces){

								let index = 0;
								let foundWorkspace = false;

								for(let i=0; i< workspaces.length; i++){
									if(fileUri.includes(workspaces[i]["uri"]["fsPath"])){
										foundWorkspace = true;
										index = i;
										break;
									}
	
								}
	
	
								if(foundWorkspace){
									const workspacePath = workspaces[index]["uri"]["fsPath"]
									const workspaceName = workspaces[index]["name"]
									relPath = fileUri.replace(workspacePath, '');
									dest = `ShareError/${uid}/${workspaceName}${relPath}`
								}
								else{
									relPath = fileUri
									dest = `ShareError/${uid}${fileUri}`;
								}
								
								const storageRef = firebaseStorageFile.ref(storage, dest);
	
								
								firebaseStorageFile.uploadBytes(storageRef, fs.readFileSync(fileUri)).then((snapshot) => {
									console.log('Uploaded a blob or file!');
								});
	
								files[relPath] = `https://storage.googleapis.com/${bucketName}/${dest}`
							}else{
								relPath = fileUri
								dest = `ShareError/${uid}${fileUri}`;
							}
							
							const storageRef = firebaseStorageFile.ref(storage, dest);

							
							firebaseStorageFile.uploadBytes(storageRef, fs.readFileSync(fileUri)).then((snapshot) => {
								console.log('Uploaded a blob or file!');
							});

							files[relPath] = `https://storage.googleapis.com/${bucketName}/${dest}`

							}

						}
					)

					metadata["files"] = files

					firestoreFile.setDoc(firestoreFile.doc(db, `colabs/${uid}`), metadata);

					break;
				
				  default:
					break;
			  }
			},
			undefined,
			context.subscriptions
		)
		//vscode.window.showInformationMessage('Hello World from Share Error!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
