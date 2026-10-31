(() => {
  const DB_NAME = "changedgames-library";
  const STORE_NAME = "games";
  const picker = document.getElementById("iso-picker");
  const list = document.getElementById("game-library-list");
  const status = document.getElementById("library-status");
  if (!picker || !list || !status) return;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("This browser does not support IndexedDB."));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open local storage."));
    });
  }

  async function withStore(mode, operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let request;
      try { request = operation(store); }
      catch (error) { db.close(); reject(error); return; }
      tx.oncomplete = () => { db.close(); resolve(request && request.result); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error("Storage operation failed.")); };
    });
  }

  const formatSize = bytes => bytes < 1024 ** 2
    ? (bytes / 1024).toFixed(1) + " KB"
    : (bytes / 1024 ** 2).toFixed(2) + " MB";

  async function renderLibrary() {
    try {
      const games = await withStore("readonly", store => store.getAll());
      list.replaceChildren();
      if (!games.length) {
        const empty = document.createElement("p");
        empty.className = "empty-library";
        empty.textContent = "No games saved yet. Choose “Add ISO files” to add files from your computer.";
        list.append(empty);
        return;
      }
      games.sort((a, b) => a.name.localeCompare(b.name));
      for (const game of games) {
        const row = document.createElement("article");
        row.className = "game-entry";
        const info = document.createElement("div");
        info.className = "game-entry-info";
        const name = document.createElement("div");
        name.className = "game-entry-name";
        name.textContent = game.name;
        const meta = document.createElement("div");
        meta.className = "game-entry-meta";
        meta.textContent = formatSize(game.size);
        info.append(name, meta);

        const actions = document.createElement("div");
        actions.className = "game-entry-actions";
        const download = document.createElement("button");
        download.type = "button";
        download.textContent = "Download ISO";
        download.addEventListener("click", () => {
          const url = URL.createObjectURL(game.file);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = game.name;
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-game";
        remove.textContent = "Remove";
        remove.addEventListener("click", async () => {
          if (!window.confirm("Remove " + game.name + " from this browser's library?")) return;
          try {
            await withStore("readwrite", store => store.delete(game.id));
            status.textContent = "Game removed from this browser.";
            await renderLibrary();
          } catch (error) {
            status.textContent = error.message;
          }
        });
        actions.append(download, remove);
        row.append(info, actions);
        list.append(row);
      }
    } catch (error) {
      status.textContent = error.message + " Your browser may block local storage in this context.";
    }
  }

  picker.addEventListener("change", async () => {
    const files = Array.from(picker.files || []);
    if (!files.length) return;
    const invalid = files.filter(file => !file.name.toLowerCase().endsWith(".iso"));
    if (invalid.length) {
      status.textContent = "Only .iso files are accepted. Other selected files were skipped.";
    } else {
      status.textContent = "Saving " + files.length + " file(s)…";
    }
    try {
      let saved = 0;
      for (const file of files.filter(file => file.name.toLowerCase().endsWith(".iso"))) {
        await withStore("readwrite", store => store.add({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          addedAt: Date.now(),
          file
        }));
        saved++;
      }
      status.textContent = saved
        ? saved + " ISO file(s) saved in this browser."
        : "No ISO files were added.";
      await renderLibrary();
    } catch (error) {
      status.textContent = "Could not save file: " + error.message + " Check available browser storage.";
    } finally {
      picker.value = "";
    }
  });

  renderLibrary();
})();