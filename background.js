// Opens Sauti as its own full browser tab when the toolbar icon is
// clicked, instead of injecting into whatever page happens to be open.
// This works with zero internet connection and needs no website loaded
// first, since panel.html is a page bundled inside the extension itself.
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("panel.html");
  const existing = await chrome.tabs.query({ url });
  if (existing.length > 0) {
    await chrome.tabs.update(existing[0].id, { active: true });
    await chrome.windows.update(existing[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});
