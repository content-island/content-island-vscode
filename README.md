# Content Island VSCode Extension

Seamlessly connect **Content Island** (Headless CMS) with **Visual Studio Code** to edit, sync, and manage your content with a single click.  
This extension bridges your CMS and your editor: open any field from Content Island directly in VS Code, make changes locally, and push or pull updates between both environments.

---

## ✨ Features

- **Open from Content Island → VS Code**: deep links open specific entries and fields directly in your editor.
- **Structured editing for Markdown/MDX**: edit rich text fields using your favorite tools, linters, and formatters.
- **Push and pull content**: update your CMS from VS Code or fetch the latest version back to your workspace.
- **Link-based authentication**: simple and secure login flow — no tokens required.
- **Sidebar view**: access a list of your most recently edited entries, organized by project, for quick navigation.

---

## 📦 Requirements

- VS Code 1.105.x or newer
- Access to a Content Island workspace with edit permissions

---

## 🚀 Installation

1. Open **VS Code → Extensions**
2. Search for `Content Island`
3. Click **Install**, then **Reload** the window
4. Log in into **Content Island**
5. Select a content
6. Click **Open in VS Code** next to any field or entry to start editing!

---

## ⚙️ Configuration

Open **Settings → Extensions → Content Island**, or edit your `settings.json` manually:

```json
{
  "contentIsland.apiVersion": "1.0",
  "contentIsland.domain": "api.contentisland.net",
  "contentIsland.loginDomain": "app.contentisland.net",
  "contentIsland.secureProtocol": "true"
}
```

> Authentication is handled automatically through a secure **link-based login** flow.

---

## 🧭 How It Works

1. **From Content Island:** click “Open in VS Code” next to any field or entry.
   - A deep link like `vscode://...&contentId=...&fieldId=...` launches VS Code and opens the corresponding local file.
2. **Edit in VS Code:** make your changes locally in Markdown or MDX.
3. **Push or pull:**
   - Run **Content Island: Push content** to send your updates to the CMS.
   - Run **Content Island: Pull content** to fetch the latest version from Content Island.

---

## 🧭 Sidebar View

The extension includes a dedicated **Content Island panel** in the sidebar, showing your **most recently edited entries**, grouped by **project**.  
From here, you can quickly reopen any entry in VS Code or perform push/pull actions directly.

---

## 🧪 Recommended Workflow

1. Click **Open in VS Code** from Content Island.
2. Edit Markdown/MDX content locally.
3. Use **Push content** to update the CMS or **Pull content** to refresh.

---

## 📄 License

MIT License

---

## 🔗 Useful Links

- [Content Island](https://contentisland.net/)
- [Content Island documentation](https://docs.contentisland.net)
