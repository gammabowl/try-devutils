chrome.runtime.onInstalled.addListener(() => {
  console.log("TryDevUtils Chrome extension installed");
});

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("extension/index.html");
  const tabs = await chrome.tabs.query({ url });

  if (tabs.length > 0 && tabs[0].id) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return;
  }

  await chrome.tabs.create({ url });
});
