// Mock implementation of Obsidian API for testing
export class App {
  vault = {};
  workspace = {};
}

export class MarkdownView {
  editor = {};
}

export class Plugin {
  app: App;
  constructor(app: App) {
    this.app = app;
  }
}

export class Notice {
  constructor(message: string) {
    console.log(`Notice: ${message}`);
  }
}

export class TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  stat: { size: number; mtime: Date };

  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
    this.basename = this.name.replace(/\.[^/.]+$/, '');
    this.extension = this.name.split('.').pop() || '';
    this.stat = { size: 0, mtime: new Date() };
  }
}

export class WorkspaceLeaf {
  view: any;
  
  setViewState(viewState: any) {
    return Promise.resolve();
  }
}

export class ItemView {
  containerEl: HTMLElement;
  leaf: WorkspaceLeaf;

  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.containerEl = document.createElement('div');
  }

  getViewType(): string {
    return 'mock-view';
  }

  getDisplayText(): string {
    return 'Mock View';
  }

  getIcon(): string {
    return 'mock-icon';
  }

  onOpen(): Promise<void> {
    return Promise.resolve();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }
}

export class Setting {
  settingEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    return this;
  }

  setDesc(desc: string): this {
    return this;
  }

  addText(cb: (text: any) => void): this {
    const text = {
      setPlaceholder: () => text,
      setValue: () => text,
      onChange: () => text,
    };
    cb(text);
    return this;
  }

  addToggle(cb: (toggle: any) => void): this {
    const toggle = {
      setValue: () => toggle,
      onChange: () => toggle,
    };
    cb(toggle);
    return this;
  }

  addButton(cb: (button: any) => void): this {
    const button = {
      setButtonText: () => button,
      onClick: () => button,
    };
    cb(button);
    return this;
  }
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {
    // Mock implementation
  }
}

// Mock DOM if not available
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag: string) => ({
      appendChild: () => {},
      createEl: (tag: string, options?: any) => ({
        createEl: (tag: string, options?: any) => ({}),
        innerHTML: '',
      }),
      innerHTML: '',
    }),
  } as any;
}

if (typeof HTMLElement === 'undefined') {
  global.HTMLElement = class {} as any;
}