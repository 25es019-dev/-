const storageStatus = document.getElementById("storage-status");
const stockDisplays = document.querySelectorAll(".product-stock");
const stockInputs = document.querySelectorAll(".stock-input");
const inventoryForm = document.getElementById("inventory-form");
const inventoryStorageKey = "bunkasai-inventory";

const stockCounts = Array(stockDisplays.length).fill(0);
const dirtyInputs = Array(stockInputs.length).fill(false);

function showStorageError(message, error) {
  storageStatus.textContent = message;
  storageStatus.hidden = false;
  console.error(message, error);
}

function isValidCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function normalizeInventory(inventory) {
  if (!Array.isArray(inventory) || !inventory.every(isValidCount)) {
    throw new Error("Saved inventory data has an invalid format.");
  }
  if (inventory.length === stockCounts.length) {
    return inventory;
  }
  if (inventory.length === stockCounts.length * 2) {
    const groupedInventory = [
      inventory[0] + inventory[1],
      inventory[2] + inventory[3]
    ];
    if (!groupedInventory.every(isValidCount)) {
      throw new Error("Combined inventory data exceeds the supported range.");
    }
    return groupedInventory;
  }
  throw new Error("Saved inventory data has an invalid format.");
}

function updateStockDisplay(productIndex, updateInput = false) {
  stockDisplays[productIndex].textContent = stockCounts[productIndex];
  if (updateInput) {
    stockInputs[productIndex].value = stockCounts[productIndex];
    dirtyInputs[productIndex] = false;
  }
}

try {
  const savedInventory = localStorage.getItem(inventoryStorageKey);
  if (savedInventory !== null) {
    const storedInventory = JSON.parse(savedInventory);
    const parsedInventory = normalizeInventory(storedInventory);
    parsedInventory.forEach((savedCount, index) => {
      stockCounts[index] = savedCount;
    });
    if (storedInventory.length !== stockCounts.length) {
      localStorage.setItem(inventoryStorageKey, JSON.stringify(stockCounts));
    }
  }
} catch (error) {
  showStorageError("在庫データを読み込めませんでした。在庫数は0から開始します。", error);
}

stockCounts.forEach((stockCount, index) => {
  updateStockDisplay(index, true);
});

stockInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    dirtyInputs[index] = true;
  });
});

inventoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!inventoryForm.reportValidity()) {
    return;
  }

  const proposedCounts = Array.from(stockInputs, (input) => Number(input.value));
  if (!proposedCounts.every(isValidCount)) {
    showStorageError("在庫数は0以上の整数で入力してください。", new Error("Invalid inventory input."));
    return;
  }

  if (!window.confirm("この内容で登録しますか？")) {
    return;
  }

  try {
    localStorage.setItem(inventoryStorageKey, JSON.stringify(proposedCounts));
    proposedCounts.forEach((count, index) => {
      stockCounts[index] = count;
      updateStockDisplay(index, true);
    });
    storageStatus.hidden = true;
    storageStatus.textContent = "";
  } catch (error) {
    showStorageError("在庫を保存できませんでした。入力内容は登録されていません。", error);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== inventoryStorageKey) {
    return;
  }
  try {
    const parsedInventory = event.newValue === null
      ? Array(stockCounts.length).fill(0)
      : normalizeInventory(JSON.parse(event.newValue));
    parsedInventory.forEach((savedCount, index) => {
      stockCounts[index] = savedCount;
      updateStockDisplay(index, !dirtyInputs[index]);
    });
  } catch (error) {
    showStorageError("在庫データの更新を読み込めませんでした。", error);
  }
});
