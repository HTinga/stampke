# Developer Guide: Building the Stamp Windows Installer

This guide explains how to generate the official Windows NSIS installer for the **Stamp** standalone application.

## Prerequisites
-   Development environment (Node.js 20+).
-   All dependencies installed: `npm install`.
-   Vite build system set up.

## Generating the Installer

To build the installer, simply run the following command in your terminal:

```bash
npm run dist:win
```

### What this command does:
1.  **Vite Build**: Compiles the React/TypeScript source code into the `dist` folder.
2.  **Electron-Builder**: Initiates the NSIS bundling process, which:
    -   Collects the `dist` assets.
    -   Bundles the Electron main process from `standalone-app/electron`.
    -   Uses the icon from `build/icon.png`.
    -   Configures the setup wizard (uninstaller, shortcuts, registry entries).

## Build Output

After the command completes, you will find the final installer in the `release` directory:

-   **Installer**: `release/Stamp Setup 1.0.0.exe`
-   **Unpacked App**: `release/win-unpacked/` (useful for testing without installing).

## Customization

If you need to change the installer behavior (e.g., changing the product name or adding a custom logo), edit the `build` section in your `package.json`:

```json
"build": {
  "productName": "Stamp",
  "nsis": {
    "installerIcon": "build/custom-icon.ico",
    "uninstallerIcon": "build/custom-icon.ico",
    "oneClick": false
  }
}
```

## Professional Icon Note

We have generated a primary **Stamp** icon in the `build/` directory (`icon.png`).
For the most consistent Windows experience, you can convert this PNG to a `.ico` file using any online tool (supporting 256px, 64px, 32px, 16px sizes) and update the `package.json` to point to the `.ico` version.

> [!TIP]
> Always test the uninstaller before a public release to ensure no files or registry keys are left behind on the user's system.
