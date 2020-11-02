class ScriptDude {
  
    constructor(hoehe, breite) {
      this.fileManager = FileManager.iCloud()
      this.documentsDirectory = this.fileManager.documentsDirectory()
      this.updateableScripts = [];
      this.uptodateScripts = [];
      this.table = new UITable();
    }
    
    ensureCorrectScriptNaming() {
      const scriptName = 'ScriptDude';
      if(Script.name() != scriptName) {
        let alert = new Alert();
        alert.title = 'Wrong script name';
        alert.message = `In order to work properly, this script needs to be named "${scriptName}". Please rename the script by clicking on its title and run it again.`;
        alert.addCancelAction("Okay");
        alert.presentAlert();
        Script.complete();
        throw "Wrong script name";
      }
    }
    
    hashCode(input) {
      return Array.from(input).reduce((accumulator, currentChar) => Math.imul(31, accumulator) + currentChar.charCodeAt(0), 0)
    }
    
    render() {
      this.table.removeAllRows();
      this.getPackageUI().map(row => this.table.addRow(row));
      this.table.reload();
    }
    
    getPackageUI() {
      let rows = [];    
      if(this.updateableScripts.length) {
        rows.push(...this.getPackageUISection("Updates", this.updateableScripts));
      }
      if(this.uptodateScripts.length) {
        rows.push(...this.getPackageUISection("Installed", this.uptodateScripts));
      }
      let manualInstall = new UITableRow();
      let manualInstallButton = manualInstall.addButton("Install from URL");
      manualInstallButton.onTap = () => {
        this.getInstallationUI();
      }
      rows.push(manualInstall);
      let scriptablesLink = new UITableRow();
      let scriptablesLinkButton = scriptablesLink.addButton("Browse scriptables.net");
      scriptablesLinkButton.onTap = () => {
        Safari.open('https://scriptables.net/');
      }
      rows.push(scriptablesLink);
      return rows;
    }
    
    getPackageUISection(title, scripts) {
      let rows = [];
      let header = new UITableRow();
      let text = header.addText(title);
      text.titleFont = Font.headline();
      rows.push(header, ...scripts.map(this.getPackageUIRow.bind(this)), new UITableRow());
      return rows;
    }
    
    getPackageUIRow(script) {
      const iconWidth = 60;
      let row = new UITableRow();
      let text = row.addText(script.name, script.source.split('/')[2]);
      text.subtitleFont = Font.systemFont(10)
      if(script.updateAvailable) {
        let updateButton = row.addButton("Update");
        updateButton.titleColor = Color.red()
        updateButton.rightAligned();
        updateButton.onTap = () => {
          this.updateScript(script);
        }
        updateButton.widthWeight = iconWidth;
      }
      let documentationButton = row.addButton("Docs");
      documentationButton.rightAligned();
      documentationButton.onTap = () => {
        Safari.open(script.docs)
      }
      documentationButton.widthWeight = iconWidth;
      let width = Device.screenSize().width - (script.updateAvailable ? iconWidth*2 : iconWidth);
      text.widthWeight = width;
      return row;
    }
    
    async installScript(name, sourceUrl, documentationUrl, icon, color, showMessage) {
      let filePath = this.fileManager.joinPath(this.documentsDirectory, name + '.js');
      if(this.fileManager.fileExists(filePath)) {
        let error = new Alert();
        error.title = `A script with the name ${name} does already exist.`;
        error.presentAlert();
        return;
      }
      if(false != showMessage) {
        let warning = new Alert();
        warning.title = "Warning";
        warning.message = `Scriptable scripts can access sensitive data on your device. Make sure to check downloaded scripts before running them for the first time. Do you want to continue downloading "${name}" from "${sourceUrl}"?`;
        warning.addAction("Continue");
        warning.addCancelAction("Cancel");
        let result = await warning.presentAlert();
        if(-1 == result) {
          return;
        }
      }
      let req = new Request(sourceUrl);
      let code = await req.loadString();
      console.log(code)
      let hash = this.hashCode(code);
      let codeToStore = Data.fromString(`// Variables used by Scriptable.\n// These must be at the very top of the file. Do not edit.\n// icon-color: ${color || 'blue'}; icon-glyph: ${icon || 'circle'};\n// This script was downloaded using ScriptDude.\n// Do not remove these lines, if you want to benefit from automatic updates.\n// source: ${sourceUrl}; docs: ${documentationUrl}; hash: ${hash};\n\n${code}`);
      this.fileManager.write(filePath, codeToStore);
      this.showLoadingIndicator();
      this.updateScriptsData().then(() => { this.render() })
    }
    
    async getInstallationUI() {
      let install = new Alert()
      install.title = "Install"
      install.message = "ScriptDude makes downloading and updating Scriptable scripts easy.";
      install.addTextField("Script Name")
      install.addTextField("Source URL")
      install.addTextField("Documentation URL")
      install.addAction("Install")
      install.addCancelAction("Cancel")
      let result = await install.presentAlert()
      if(0 == result) {
        let name = install.textFieldValue(0)
        let source = install.textFieldValue(1)
        let documentation = install.textFieldValue(2)
        await this.installScript(name, source, documentation)
      }
    }
    
    async run() {
      this.ensureCorrectScriptNaming();
      this.showLoadingIndicator();
      await this.updateScriptsData();
      this.render();
      this.table.present(true);
      this.checkForInstallationRequestFromWeb();
    }
    
    checkForInstallationRequestFromWeb() {
      try {
        let data = args.queryParameters;
        if(data.name && data.source && data.docs) {
          this.installScript(data.name, data.source, data.docs, data.icon, data.color, true);
        }
      } catch(e) {
        // Input malformed      
      }
    }
    
    showLoadingIndicator() {
      let row = new UITableRow();
      row.addText("Loading", "Please be patient, ScriptDude is collecting information about your scripts and checks for available updates.");
      row.height = 100;
      this.table.removeAllRows();
      this.table.addRow(row);
      this.table.reload();
    }
    
    updateScript(script) {
      let header = script.content.split("\n", 5).join("\n");
      let codeToStore = Data.fromString(`${header}\n// source: ${script.source}; docs: ${script.docs}; hash: ${script.updatePayload.hash};\n\n${script.updatePayload.code}`);
      this.fileManager.write(script.path, codeToStore);
      this.showLoadingIndicator();
      this.updateScriptsData().then(() => { this.render() })
    }
    
    async updateScriptsData() {
      let files = this.fileManager.listContents(this.documentsDirectory)
      let managedScripts = files
        // Convert to full paths
        .map(fileName => this.fileManager.joinPath(this.documentsDirectory, fileName))
        // Remove directories
        .filter(filePath => !this.fileManager.isDirectory(filePath))
        // Add file name and content metadata
        .map(filePath => {
          return {
            path: filePath,
            name: this.fileManager.fileName(filePath),
            content: this.fileManager.read(filePath).toRawString()
          };
        })
        // Filter for scripts that show up in Scriptable
        .filter(file => file.content && file.content.trimLeft().startsWith("// Variables used by Scriptable."))
        // Add source and origin metadata
        .map(file => {
          let potentialScriptData = file.content
            .split("\n")
            .filter(line => line.length != 0)
            .map(line => line.trim())[5]
            if(!!potentialScriptData && potentialScriptData.startsWith('//') 
              && potentialScriptData.indexOf('source:') != -1 
              && potentialScriptData.indexOf('hash:') != -1
              && potentialScriptData.indexOf('docs:') != -1) {
              let customMetadata = potentialScriptData
                .substr(2)
                .split(';')
                .map(keyValue => keyValue.split(':').map(text => text.trim()))
                .filter(keyValue => keyValue[0].length)
                .reduce((dict, addable) => { 
                  dict[addable.shift()] = addable.join(':');
                  return dict;
                }, {});
              if(!!customMetadata['source'] 
                && !!customMetadata['hash']) {
                file.source = customMetadata['source'];
                file.hash = customMetadata['hash'];
                file.docs = customMetadata['docs'] || '';
              }
            }
          return file
        })
        // Filter for scripts managed by Scriptstore
        .filter(file => !!file.source && !!file.hash);
        
      managedScripts = await Promise.all(managedScripts.map(async (script) => {
        let req = new Request(script.source);
        let code = await req.loadString();
        let hash = this.hashCode(code);
        script.updateAvailable = hash != script.hash;
        script.updatePayload = {
          hash: hash,
          code: code
        }
        return script;
      }));
      managedScripts = managedScripts.sort((a, b) => a.name < b.name ? -1 : 1);
      this.updateableScripts = managedScripts.filter(script => script.updateAvailable);
      this.uptodateScripts = managedScripts.filter(script => !script.updateAvailable);
    }
    
  }
  
  await new ScriptDude().run();